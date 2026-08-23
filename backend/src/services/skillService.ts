import { PrismaClient, SkillCategory, SkillProficiency } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Skill Service - Provides skill matching and management utilities
 */

// Get skills by category
export const getSkillsByCategory = async (category: SkillCategory) => {
  return prisma.skill.findMany({
    where: {
      category,
      isActive: true
    },
    orderBy: { name: 'asc' }
  });
};

// Get top skills by usage count
export const getTopSkills = async (limit = 10) => {
  const skills = await prisma.skill.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          talent_skills: true,
          casting_call_skills: true
        }
      }
    },
    orderBy: [
      { talent_skills: { _count: 'desc' } },
      { casting_call_skills: { _count: 'desc' } }
    ],
    take: limit
  });
  
  return skills.map(skill => ({
    ...skill,
    usageCount: skill._count.talent_skills + skill._count.casting_call_skills
  }));
};

// Calculate skill match score between talent and casting call
export const calculateSkillMatchScore = (
  talentSkillIds: string[],
  castingCallSkills: Array<{
    skillId: string;
    required: boolean;
    weight: number;
  }>
): {
  score: number;
  requiredMatchCount: number;
  optionalMatchCount: number;
  requiredSkills: string[];
  matchedRequired: string[];
  optionalSkills: string[];
  matchedOptional: string[];
} => {
  const requiredSkills = castingCallSkills
    .filter(ccs => ccs.required)
    .map(ccs => ccs.skillId);
  const optionalSkills = castingCallSkills
    .filter(ccs => !ccs.required)
    .map(ccs => ccs.skillId);
  
  const matchedRequired = requiredSkills.filter(skillId => 
    talentSkillIds.includes(skillId)
  );
  const matchedOptional = optionalSkills.filter(skillId => 
    talentSkillIds.includes(skillId)
  );
  
  const requiredWeight = castingCallSkills
    .filter(ccs => ccs.required && talentSkillIds.includes(ccs.skillId))
    .reduce((sum, ccs) => sum + ccs.weight, 0);
  const optionalWeight = castingCallSkills
    .filter(ccs => !ccs.required && talentSkillIds.includes(ccs.skillId))
    .reduce((sum, ccs) => sum + ccs.weight, 0);
  
  const requiredScore = requiredSkills.length > 0 
    ? (matchedRequired.length / requiredSkills.length) * 0.7
    : 0;
  const optionalScore = optionalSkills.length > 0
    ? (matchedOptional.length / optionalSkills.length) * 0.3
    : 0;
  
  const score = ((requiredScore + optionalScore) * 100) + 
               (requiredWeight * 5) + 
               (optionalWeight * 2);
  
  return {
    score: Math.min(score, 100),
    requiredMatchCount: matchedRequired.length,
    optionalMatchCount: matchedOptional.length,
    requiredSkills,
    matchedRequired,
    optionalSkills,
    matchedOptional
  };
};

// Find best matching talents for a casting call
export const findMatchingTalents = async (
  castingCallId: string,
  limit = 10
) => {
  const castingCall = await prisma.castingCall.findUnique({
    where: { id: castingCallId },
    include: {
      casting_call_skills: true
    }
  });
  
  if (!castingCall) {
    throw new Error('Casting call not found');
  }
  
  const talents = await prisma.talentProfile.findMany({
    include: {
      profile: {
        include: {
          user: true
        }
      },
      talent_skills: true
    }
  });
  
  const results = talents.map(talent => {
    const talentSkillIds = talent.talent_skills.map(ts => ts.skillId);
    const match = calculateSkillMatchScore(
      talentSkillIds,
      castingCall.casting_call_skills
    );
    
    return {
      talentProfile: talent,
      score: match.score,
      requiredMatchCount: match.requiredMatchCount,
      requiredSkillsCount: match.requiredSkills.length,
      optionalMatchCount: match.optionalMatchCount,
      optionalSkillsCount: match.optionalSkills.length,
      matchedRequired: match.matchedRequired,
      matchedOptional: match.matchedOptional
    };
  }).filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return results;
};

// Find best matching casting calls for a talent
export const findMatchingCastingCalls = async (
  talentProfileId: string,
  limit = 10
) => {
  const talent = await prisma.talentProfile.findUnique({
    where: { id: talentProfileId },
    include: {
      talent_skills: true
    }
  });
  
  if (!talent) {
    throw new Error('Talent profile not found');
  }
  
  const castingCalls = await prisma.castingCall.findMany({
    where: { status: 'OPEN' },
    include: {
      casting_call_skills: true
    }
  });
  
  const talentSkillIds = talent.talent_skills.map(ts => ts.skillId);
  
  const results = castingCalls.map(call => {
    const match = calculateSkillMatchScore(
      talentSkillIds,
      call.casting_call_skills
    );
    
    return {
      castingCall: call,
      score: match.score,
      requiredMatchCount: match.requiredMatchCount,
      requiredSkillsCount: match.requiredSkills.length,
      optionalMatchCount: match.optionalMatchCount,
      optionalSkillsCount: match.optionalSkills.length,
      matchedRequired: match.matchedRequired,
      matchedOptional: match.matchedOptional
    };
  }).filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return results;
};

// Get skill recommendations for a talent based on similar talents
export const getSkillRecommendations = async (
  talentProfileId: string,
  limit = 5
) => {
  const talent = await prisma.talentProfile.findUnique({
    where: { id: talentProfileId },
    include: {
      talent_skills: {
        include: { skill: true }
      }
    }
  });
  
  if (!talent) {
    throw new Error('Talent profile not found');
  }
  
  const talentSkillIds = talent.talent_skills.map(ts => ts.skillId);
  
  // Find talents with similar skills
  const similarTalents = await prisma.talentProfile.findMany({
    where: {
      id: { not: talentProfileId },
      talent_skills: {
        some: {
          skillId: { in: talentSkillIds }
        }
      }
    },
    include: {
      talent_skills: {
        include: { skill: true }
      }
    },
    take: 20
  });
  
  // Collect all skills from similar talents
  const allSkillsFromSimilar = similarTalents.flatMap(t => 
    t.talent_skills.map(ts => ts.skillId)
  );
  
  // Find skills that talent doesn't have but similar talents do
  const recommendedSkills = await prisma.skill.findMany({
    where: {
      id: { 
        in: allSkillsFromSimilar,
        notIn: talentSkillIds
      },
      isActive: true
    },
    include: {
      _count: {
        select: { talent_skills: true }
      }
    },
    orderBy: [
      { talent_skills: { _count: 'desc' } },
      { name: 'asc' }
    ],
    take: limit
  });
  
  return recommendedSkills;
};

// Get trending skills (most used in casting calls)
export const getTrendingSkills = async (limit = 10) => {
  const skills = await prisma.skill.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { casting_call_skills: true }
      }
    },
    orderBy: {
      casting_call_skills: { _count: 'desc' }
    },
    take: limit
  });
  
  return skills;
};

// Get emerging skills (recently added and gaining popularity)
export const getEmergingSkills = async (limit = 10) => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const skills = await prisma.skill.findMany({
    where: {
      isActive: true,
      createdAt: { gte: oneMonthAgo }
    },
    include: {
      _count: {
        select: { talent_skills: true }
      }
    },
    orderBy: [
      { createdAt: 'desc' },
      { talent_skills: { _count: 'desc' } }
    ],
    take: limit
  });
  
  return skills;
};

// Batch add skills to talent
export const batchAddSkillsToTalent = async (
  talentProfileId: string,
  skillIds: string[],
  proficiency: SkillProficiency = SkillProficiency.BEGINNER,
  yearsExperience?: number
) => {
  // Check which skills already exist
  const existingSkills = await prisma.talentSkill.findMany({
    where: {
      talentProfileId,
      skillId: { in: skillIds }
    }
  });
  
  const existingSkillIds = existingSkills.map(es => es.skillId);
  const newSkillIds = skillIds.filter(id => !existingSkillIds.includes(id));
  
  // Add only new skills
  const results = [];
  for (const skillId of newSkillIds) {
    const talentSkill = await prisma.talentSkill.create({
      data: {
        talentProfileId,
        skillId,
        proficiency,
        yearsExperience
      }
    });
    results.push(talentSkill);
  }
  
  return results;
};

// Batch remove skills from talent
export const batchRemoveSkillsFromTalent = async (
  talentProfileId: string,
  skillIds: string[]
) => {
  const results = [];
  
  for (const skillId of skillIds) {
    const talentSkill = await prisma.talentSkill.findFirst({
      where: {
        talentProfileId,
        skillId
      }
    });
    
    if (talentSkill) {
      await prisma.talentSkill.delete({
        where: { id: talentSkill.id }
      });
      results.push(talentSkill.id);
    }
  }
  
  return results;
};

export default {
  getSkillsByCategory,
  getTopSkills,
  calculateSkillMatchScore,
  findMatchingTalents,
  findMatchingCastingCalls,
  getSkillRecommendations,
  getTrendingSkills,
  getEmergingSkills,
  batchAddSkillsToTalent,
  batchRemoveSkillsFromTalent
};
