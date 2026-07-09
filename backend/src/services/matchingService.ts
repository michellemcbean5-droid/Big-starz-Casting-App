import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';

export interface MatchResult {
  id: string;
  score: number;
  data: any;
  explanation: string;
  breakdown: {
    skills: number;
    location: number;
    union: number;
    experience: number;
    availability: number;
  };
}

interface CastingRequirements {
  skills?: string[];
  location?: string;
  unionStatus?: string;
  experienceYears?: number;
  availability?: string;
  ageMin?: number;
  ageMax?: number;
}

function parseRequirements(requirementsJson: any): CastingRequirements {
  if (!requirementsJson) return {};
  if (typeof requirementsJson === 'string') {
    try { return JSON.parse(requirementsJson); } catch { return {}; }
  }
  if (typeof requirementsJson === 'object' && !Array.isArray(requirementsJson)) {
    return requirementsJson as CastingRequirements;
  }
  return {};
}

function calculateSkillsScore(talentSkills: string[], requiredSkills: string[]): number {
  if (!requiredSkills || requiredSkills.length === 0) return 50;
  const matches = talentSkills.filter((skill) =>
    requiredSkills.some((req) => req.toLowerCase() === skill.toLowerCase())
  );
  return (matches.length / requiredSkills.length) * 100;
}

function calculateLocationScore(talentLocation: string, requiredLocation: string): number {
  if (!requiredLocation) return 50;
  if (!talentLocation) return 0;
  const tl = talentLocation.toLowerCase().trim();
  const rl = requiredLocation.toLowerCase().trim();
  if (tl === rl) return 100;
  if (tl.includes(rl) || rl.includes(tl)) return 75;
  return 25;
}

function calculateUnionScore(talentUnion: string, requiredUnion: string): number {
  if (!requiredUnion) return 50;
  if (!talentUnion) return 0;
  if (talentUnion === requiredUnion) return 100;
  if ((talentUnion === 'SAG_AFTRA' && requiredUnion === 'AFTRA') ||
      (talentUnion === 'AFTRA' && requiredUnion === 'SAG_AFTRA')) {
    return 75;
  }
  if (talentUnion === 'NON_UNION') return 50;
  return 0;
}

function calculateExperienceScore(talentExp: number | null, requiredExp: number | null): number {
  if (requiredExp === null || requiredExp === undefined) return 50;
  if (talentExp === null || talentExp === undefined) return 0;
  if (talentExp >= requiredExp) return 100;
  if (talentExp >= requiredExp * 0.5) return 75;
  if (talentExp > 0) return 50;
  return 0;
}

function calculateAvailabilityScore(talentAvailability: string | null, requiredAvailability: string | null): number {
  if (!requiredAvailability) return 50;
  if (!talentAvailability) return 0;
  const ta = talentAvailability.toLowerCase();
  const ra = requiredAvailability.toLowerCase();
  if (ta === ra) return 100;
  if (ta.includes('immediate') || ta.includes('available')) return 80;
  if (ta.includes('flexible')) return 60;
  return 40;
}

export function scoreMatch(talent: any, castingCall: any): { score: number; breakdown: any; explanation: string } {
  const requirements = parseRequirements(castingCall.requirements);
  const skillsScore = calculateSkillsScore(talent.skills || [], requirements.skills || []);
  const locationScore = calculateLocationScore(
    talent.profile?.location || '',
    castingCall.location || requirements.location || ''
  );
  const unionScore = calculateUnionScore(
    talent.unionStatus || '',
    requirements.unionStatus || ''
  );
  const experienceScore = calculateExperienceScore(
    talent.experienceYears || null,
    requirements.experienceYears || null
  );
  const availabilityScore = calculateAvailabilityScore(
    talent.availability || null,
    requirements.availability || null
  );
  const score = Math.round(
    skillsScore * 0.40 +
    locationScore * 0.20 +
    unionScore * 0.15 +
    experienceScore * 0.15 +
    availabilityScore * 0.10
  );
  const breakdown = {
    skills: Math.round(skillsScore),
    location: Math.round(locationScore),
    union: Math.round(unionScore),
    experience: Math.round(experienceScore),
    availability: Math.round(availabilityScore),
  };
  const reasons: string[] = [];
  if (skillsScore >= 80) {
    reasons.push(`Strong skills match (${Math.round(skillsScore)}%)`);
  } else if (skillsScore > 0) {
    reasons.push(`Partial skills match (${Math.round(skillsScore)}%)`);
  } else {
    reasons.push('Limited skills match');
  }
  if (locationScore >= 75) {
    reasons.push(`Location aligned (${Math.round(locationScore)}%)`);
  } else if (locationScore > 0) {
    reasons.push(`Location may require travel (${Math.round(locationScore)}%)`);
  }
  if (unionScore >= 75) {
    reasons.push(`Union status compatible (${Math.round(unionScore)}%)`);
  }
  if (experienceScore >= 80) {
    reasons.push(`Experience level meets requirements (${Math.round(experienceScore)}%)`);
  }
  const explanation = reasons.join('. ');
  return { score, breakdown, explanation };
}

export async function findTalentProfileByUserId(userId: string) {
  return prisma.talentProfile.findFirst({
    where: {
      profile: {
        userId,
      },
    },
    include: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
          displayName: true,
          avatarUrl: true,
          location: true,
          bio: true,
          userId: true,
        },
      },
    },
  });
}

export async function matchTalentToCastingCall(castingCallId: string, limit: number = 10): Promise<MatchResult[]> {
  const castingCall = await prisma.castingCall.findUnique({
    where: { id: castingCallId },
    include: {
      director: {
        select: {
          id: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!castingCall) {
    throw ApiError.notFound('Casting call not found');
  }

  const talentProfiles = await prisma.talentProfile.findMany({
    include: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
          displayName: true,
          avatarUrl: true,
          location: true,
          bio: true,
          userId: true,
        },
      },
    },
  });

  const matches: MatchResult[] = talentProfiles.map((talent) => {
    const { score, breakdown, explanation } = scoreMatch(talent, castingCall);
    return {
      id: talent.id,
      score,
      data: talent,
      explanation,
      breakdown,
    };
  });

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}

export async function matchCastingCallToTalent(talentProfileId: string, limit: number = 10): Promise<MatchResult[]> {
  const talentProfile = await prisma.talentProfile.findUnique({
    where: { id: talentProfileId },
    include: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
          displayName: true,
          avatarUrl: true,
          location: true,
          bio: true,
          userId: true,
        },
      },
    },
  });

  if (!talentProfile) {
    throw ApiError.notFound('Talent profile not found');
  }

  const castingCalls = await prisma.castingCall.findMany({
    where: {
      status: 'OPEN',
    },
    include: {
      director: {
        select: {
          id: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              displayName: true,
            },
          },
        },
      },
      _count: {
        select: { applications: true },
      },
    },
  });

  const matches: MatchResult[] = castingCalls.map((castingCall) => {
    const { score, breakdown, explanation } = scoreMatch(talentProfile, castingCall);
    return {
      id: castingCall.id,
      score,
      data: castingCall,
      explanation,
      breakdown,
    };
  });

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}
