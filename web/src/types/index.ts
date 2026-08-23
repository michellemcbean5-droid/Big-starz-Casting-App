export type UserRole = "talent" | "casting_director" | "creator" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  profile?: TalentProfile;
  subscription?: Subscription;
}

export interface TalentProfile {
  id: string;
  userId: string;
  stageName?: string;
  bio?: string;
  headshots?: string[];
  reelUrl?: string;
  skills?: string[];
  location?: string;
  ageRange?: string;
  unionStatus?: string;
  avatarUrl?: string;
  portfolioUrls?: string[];
  experience?: string;
}

export interface CastingCall {
  id: string;
  title: string;
  description: string;
  directorId: string;
  status: "open" | "closed" | "draft";
  requirements?: string;
  budget?: number;
  location?: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  type?: string;
}

export interface Application {
  id: string;
  talentId: string;
  castingCallId: string;
  status: "pending" | "reviewed" | "accepted" | "rejected";
  message?: string;
  submittedAt: string;
  castingCall?: CastingCall;
}

export interface DigitalTwin {
  id: string;
  talentId: string;
  modelUrl?: string;
  consentSigned: boolean;
  generatedAt?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: "free" | "bronze" | "silver" | "gold";
  startDate: string;
  endDate?: string;
  status: "active" | "cancelled" | "expired";
}

export interface MasterCode {
  id: string;
  code: string;
  tier: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  revoked: boolean;
  createdAt: string;
}

export interface Contract {
  id: string;
  talentId: string;
  type: string;
  content: string;
  signedAt?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface Earning {
  id: string;
  userId: string;
  amount: number;
  source: string;
  status: "pending" | "paid" | "failed";
  createdAt: string;
}

export interface AiGeneration {
  id: string;
  userId: string;
  type: "scene" | "reel" | "music_video" | "digital_twin" | "other";
  input: string;
  outputUrl?: string;
  status: "pending" | "processing" | "completed" | "failed";
  cost?: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DmcaRequest {
  id: string;
  reporterEmail: string;
  contentUrl: string;
  description: string;
  status: "pending" | "reviewed" | "resolved";
  createdAt: string;
}


export type SkillCategory = 
  | 'AI_ARCHITECTURE'
  | 'BACKEND_INFRASTRUCTURE'
  | 'FULLSTACK_MOBILE'
  | 'DEVOPS_CLOUD'
  | 'SECURITY_COMPLIANCE'
  | 'DATA_ANALYTICS'
  | 'PERFORMANCE_OPTIMIZATION'
  | 'GENERATIVE_AI'
  | 'SYSTEM_DESIGN'
  | 'PRODUCTION_DEPLOYMENT';

export type SkillProficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface Skill {
  id: string;
  name: string;
  description?: string;
  category: SkillCategory;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TalentSkill {
  id: string;
  talentProfileId: string;
  skillId: string;
  proficiency: SkillProficiency;
  yearsExperience?: number;
  createdAt: string;
  updatedAt: string;
  skill?: Skill;
}

export interface CastingCallSkill {
  id: string;
  castingCallId: string;
  skillId: string;
  required: boolean;
  weight: number;
  createdAt: string;
  skill?: Skill;
}

export interface SkillMatchResult {
  score: number;
  requiredMatchCount: number;
  requiredSkillsCount: number;
  optionalMatchCount: number;
  optionalSkillsCount: number;
}

export interface TalentMatchResult {
  talentProfile: TalentProfile;
  score: number;
  requiredMatchCount: number;
  requiredSkillsCount: number;
  optionalMatchCount: number;
  optionalSkillsCount: number;
}

export interface CastingCallMatchResult {
  castingCall: CastingCall;
  score: number;
  requiredMatchCount: number;
  requiredSkillsCount: number;
  optionalMatchCount: number;
  optionalSkillsCount: number;
}

