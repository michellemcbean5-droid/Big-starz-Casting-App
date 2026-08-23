import { Request, Response } from 'express';
import { PrismaClient, SkillCategory, SkillProficiency } from '@prisma/client';

const prisma = new PrismaClient();

// List all skills with optional filtering
export const listSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = { isActive: true };
    
    if (category) {
      where.category = category as SkillCategory;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { tags: { has: String(search) } }
      ];
    }
    
    const [skills, total] = await Promise.all([
      prisma.skill.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' }
      }),
      prisma.skill.count({ where })
    ]);
    
    res.json({
      success: true,
      data: skills,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error listing skills:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch skills' });
  }
};

// List all skill categories
export const listSkillCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = Object.values(SkillCategory);
    
    res.json({
      success: true,
      data: categories.map(category => ({
        name: category,
        label: category.replace(/_/g, ' ')
      }))
    });
  } catch (error) {
    console.error('Error listing categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
};

// Get a specific skill by ID
export const getSkillById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const skill = await prisma.skill.findUnique({
      where: { id },
      include: {
        talent_skills: {
          include: {
            talent_profile: {
              include: {
                profile: {
                  include: { user: true }
                }
              }
            }
          }
        },
        casting_call_skills: {
          include: {
            casting_call: true
          }
        }
      }
    });
    
    if (!skill) {
      res.status(404).json({ success: false, error: 'Skill not found' });
      return;
    }
    
    res.json({ success: true, data: skill });
  } catch (error) {
    console.error('Error fetching skill:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch skill' });
  }
};

// Search skills
export const searchSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      res.status(400).json({ success: false, error: 'Search query is required' });
      return;
    }
    
    const skills = await prisma.skill.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: String(query), mode: 'insensitive' } },
          { description: { contains: String(query), mode: 'insensitive' } },
          { tags: { has: String(query) } }
        ]
      },
      take: 20
    });
    
    res.json({ success: true, data: skills });
  } catch (error) {
    console.error('Error searching skills:', error);
    res.status(500).json({ success: false, error: 'Failed to search skills' });
  }
};

// Get skills for a specific talent
export const getSkillsByTalent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { talentId } = req.params;
    const userId = (req as any).user?.id;
    
    // Check if user is the talent or admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    const talent = await prisma.user.findUnique({
      where: { id: talentId },
      include: {
        talentProfile: {
          include: {
            talent_skills: {
              include: {
                skill: true
              }
            }
          }
        }
      }
    });
    
    if (!talent) {
      res.status(404).json({ success: false, error: 'Talent not found' });
      return;
    }
    
    if (!talent.talentProfile) {
      res.json({ success: true, data: [] });
      return;
    }
    
    res.json({
      success: true,
      data: talent.talentProfile.talent_skills.map(ts => ({
        ...ts,
        skill: ts.skill
      }))
    });
  } catch (error) {
    console.error('Error fetching talent skills:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch talent skills' });
  }
};

// Get skills for a specific casting call
export const getSkillsByCastingCall = async (req: Request, res: Response): Promise<void> => {
  try {
    const { callId } = req.params;
    
    const castingCall = await prisma.castingCall.findUnique({
      where: { id: callId },
      include: {
        casting_call_skills: {
          include: {
            skill: true
          }
        }
      }
    });
    
    if (!castingCall) {
      res.status(404).json({ success: false, error: 'Casting call not found' });
      return;
    }
    
    res.json({
      success: true,
      data: castingCall.casting_call_skills.map(ccs => ({
        ...ccs,
        skill: ccs.skill
      }))
    });
  } catch (error) {
    console.error('Error fetching casting call skills:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch casting call skills' });
  }
};

// Create a new skill (Admin only)
export const createSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, category, tags = [] } = req.body;
    
    if (!name || !category) {
      res.status(400).json({ success: false, error: 'Name and category are required' });
      return;
    }
    
    const skill = await prisma.skill.create({
      data: {
        name,
        description,
        category: category as SkillCategory,
        tags: tags as string[],
        isActive: true
      }
    });
    
    res.status(201).json({ success: true, data: skill });
  } catch (error) {
    console.error('Error creating skill:', error);
    res.status(500).json({ success: false, error: 'Failed to create skill' });
  }
};

// Update a skill (Admin only)
export const updateSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, category, tags, isActive } = req.body;
    
    const skill = await prisma.skill.update({
      where: { id },
      data: {
        name,
        description,
        category: category as SkillCategory,
        tags: tags as string[],
        isActive
      }
    });
    
    res.json({ success: true, data: skill });
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({ success: false, error: 'Failed to update skill' });
  }
};

// Delete a skill (Admin only)
export const deleteSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await prisma.skill.delete({
      where: { id }
    });
    
    res.json({ success: true, message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ success: false, error: 'Failed to delete skill' });
  }
};

// Add a skill to a talent
export const addTalentSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { talentProfileId, skillId, proficiency = 'BEGINNER', yearsExperience } = req.body;
    const userId = (req as any).user?.id;
    
    // Verify the talent profile belongs to the user
    const talentProfile = await prisma.talentProfile.findUnique({
      where: { id: talentProfileId },
      include: { profile: { include: { user: true } } }
    });
    
    if (!talentProfile) {
      res.status(404).json({ success: false, error: 'Talent profile not found' });
      return;
    }
    
    if (talentProfile.profile.userId !== userId) {
      res.status(403).json({ success: false, error: 'Unauthorized' });
      return;
    }
    
    // Check if skill already exists
    const existing = await prisma.talentSkill.findFirst({
      where: {
        talentProfileId,
        skillId
      }
    });
    
    if (existing) {
      res.status(400).json({ success: false, error: 'Skill already added to talent' });
      return;
    }
    
    const talentSkill = await prisma.talentSkill.create({
      data: {
        talentProfileId,
        skillId,
        proficiency: proficiency as SkillProficiency,
        yearsExperience
      }
    });
    
    res.status(201).json({ success: true, data: talentSkill });
  } catch (error) {
    console.error('Error adding talent skill:', error);
    res.status(500).json({ success: false, error: 'Failed to add talent skill' });
  }
};

// Remove a skill from a talent
export const removeTalentSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    const talentSkill = await prisma.talentSkill.findUnique({
      where: { id },
      include: {
        talent_profile: {
          include: { profile: { include: { user: true } } }
        }
      }
    });
    
    if (!talentSkill) {
      res.status(404).json({ success: false, error: 'Talent skill not found' });
      return;
    }
    
    if (talentSkill.talent_profile.profile.userId !== userId) {
      res.status(403).json({ success: false, error: 'Unauthorized' });
      return;
    }
    
    await prisma.talentSkill.delete({
      where: { id }
    });
    
    res.json({ success: true, message: 'Talent skill removed successfully' });
  } catch (error) {
    console.error('Error removing talent skill:', error);
    res.status(500).json({ success: false, error: 'Failed to remove talent skill' });
  }
};

// Add a skill to a casting call
export const addCastingCallSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { castingCallId, skillId, required = false, weight = 1.0 } = req.body;
    
    // Verify casting call exists and belongs to the user
    const castingCall = await prisma.castingCall.findUnique({
      where: { id: castingCallId }
    });
    
    if (!castingCall) {
      res.status(404).json({ success: false, error: 'Casting call not found' });
      return;
    }
    
    // Check if skill already exists
    const existing = await prisma.castingCallSkill.findFirst({
      where: {
        castingCallId,
        skillId
      }
    });
    
    if (existing) {
      res.status(400).json({ success: false, error: 'Skill already added to casting call' });
      return;
    }
    
    const castingCallSkill = await prisma.castingCallSkill.create({
      data: {
        castingCallId,
        skillId,
        required: Boolean(required),
        weight: Number(weight)
      }
    });
    
    res.status(201).json({ success: true, data: castingCallSkill });
  } catch (error) {
    console.error('Error adding casting call skill:', error);
    res.status(500).json({ success: false, error: 'Failed to add casting call skill' });
  }
};

// Remove a skill from a casting call
export const removeCastingCallSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await prisma.castingCallSkill.delete({
      where: { id }
    });
    
    res.json({ success: true, message: 'Casting call skill removed successfully' });
  } catch (error) {
    console.error('Error removing casting call skill:', error);
    res.status(500).json({ success: false, error: 'Failed to remove casting call skill' });
  }
};

// Match talent to casting call based on skills
export const matchTalentToCastingCall = async (req: Request, res: Response): Promise<void> => {
  try {
    const { castingCallId, limit = 10 } = req.body;
    
    const castingCall = await prisma.castingCall.findUnique({
      where: { id: castingCallId },
      include: {
        casting_call_skills: {
          include: { skill: true }
        }
      }
    });
    
    if (!castingCall) {
      res.status(404).json({ success: false, error: 'Casting call not found' });
      return;
    }
    
    // Get all talents with their skills
    const talents = await prisma.talentProfile.findMany({
      include: {
        profile: {
          include: {
            user: true,
            talent_profile: {
              include: {
                talent_skills: {
                  include: { skill: true }
                }
              }
            }
          }
        }
      }
    });
    
    // Calculate match scores
    const matchedTalents = talents.map(talent => {
      const talentSkills = talent.talent_skills.map(ts => ts.skillId);
      const requiredSkills = castingCall.casting_call_skills
        .filter(ccs => ccs.required)
        .map(ccs => ccs.skillId);
      const optionalSkills = castingCall.casting_call_skills
        .filter(ccs => !ccs.required)
        .map(ccs => ccs.skillId);
      
      const requiredMatchCount = requiredSkills.filter(skillId => 
        talentSkills.includes(skillId)
      ).length;
      const optionalMatchCount = optionalSkills.filter(skillId => 
        talentSkills.includes(skillId)
      ).length;
      
      const score = (
        (requiredMatchCount / Math.max(requiredSkills.length, 1)) * 0.7 +
        (optionalMatchCount / Math.max(optionalSkills.length, 1)) * 0.3
      ) * 100;
      
      return {
        talentProfile: talent,
        score,
        requiredMatchCount,
        requiredSkillsCount: requiredSkills.length,
        optionalMatchCount,
        optionalSkillsCount: optionalSkills.length
      };
    }).filter(t => t.requiredMatchCount > 0 || t.optionalMatchCount > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Number(limit));
    
    res.json({ success: true, data: matchedTalents });
  } catch (error) {
    console.error('Error matching talent to casting call:', error);
    res.status(500).json({ success: false, error: 'Failed to match talent' });
  }
};

// Match casting calls to talent based on skills
export const matchCastingCallToTalent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { talentId, limit = 10 } = req.body;
    const userId = (req as any).user?.id;
    
    // Verify talent exists
    const talent = await prisma.talentProfile.findUnique({
      where: { id: talentId },
      include: {
        profile: {
          include: { user: true }
        },
        talent_skills: {
          include: { skill: true }
        }
      }
    });
    
    if (!talent) {
      res.status(404).json({ success: false, error: 'Talent not found' });
      return;
    }
    
    // Get all casting calls with their skills
    const castingCalls = await prisma.castingCall.findMany({
      where: { status: 'OPEN' },
      include: {
        casting_call_skills: {
          include: { skill: true }
        }
      }
    });
    
    // Calculate match scores
    const talentSkills = talent.talent_skills.map(ts => ts.skillId);
    
    const matchedCalls = castingCalls.map(call => {
      const requiredSkills = call.casting_call_skills
        .filter(ccs => ccs.required)
        .map(ccs => ccs.skillId);
      const optionalSkills = call.casting_call_skills
        .filter(ccs => !ccs.required)
        .map(ccs => ccs.skillId);
      
      const requiredMatchCount = requiredSkills.filter(skillId => 
        talentSkills.includes(skillId)
      ).length;
      const optionalMatchCount = optionalSkills.filter(skillId => 
        talentSkills.includes(skillId)
      ).length;
      
      const score = (
        (requiredMatchCount / Math.max(requiredSkills.length, 1)) * 0.7 +
        (optionalMatchCount / Math.max(optionalSkills.length, 1)) * 0.3
      ) * 100;
      
      return {
        castingCall: call,
        score,
        requiredMatchCount,
        requiredSkillsCount: requiredSkills.length,
        optionalMatchCount,
        optionalSkillsCount: optionalSkills.length
      };
    }).filter(c => c.requiredMatchCount > 0 || c.optionalMatchCount > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Number(limit));
    
    res.json({ success: true, data: matchedCalls });
  } catch (error) {
    console.error('Error matching casting call to talent:', error);
    res.status(500).json({ success: false, error: 'Failed to match casting calls' });
  }
};

export default {
  listSkills,
  listSkillCategories,
  getSkillById,
  searchSkills,
  getSkillsByTalent,
  getSkillsByCastingCall,
  createSkill,
  updateSkill,
  deleteSkill,
  addTalentSkill,
  removeTalentSkill,
  addCastingCallSkill,
  removeCastingCallSkill,
  matchTalentToCastingCall,
  matchCastingCallToTalent
};
