export type UserRole = 'talent' | 'casting_director' | 'creator' | 'admin';

export type SubscriptionTier = 'free' | 'bronze' | 'silver' | 'gold';

export type CastingType = 'film' | 'tv' | 'commercial' | 'music_video' | 'theater' | 'digital';

export type ApplicationStatus = 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';

export type AiGenerationType = 'scene' | 'reel' | 'music_video' | 'digital_twin';

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile?: TalentProfile;
  subscription?: Subscription;
  createdAt: string;
}

export interface TalentProfile {
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
}

export interface Subscription {
  userId: string;
  tier: SubscriptionTier;
  startDate: string;
  endDate?: string;
  status: 'active' | 'cancelled' | 'expired';
}

export interface CastingCall {
  id: string;
  title: string;
  description: string;
  type: CastingType;
  directorId: string;
  director?: User;
  status: 'open' | 'closed' | 'filled';
  requirements: string[];
  budget?: string;
  location: string;
  deadline: string;
  roles?: CastingRole[];
  createdAt: string;
}

export interface CastingRole {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  compensation?: string;
}

export interface Application {
  id: string;
  talentId: string;
  castingCallId: string;
  castingCall?: CastingCall;
  status: ApplicationStatus;
  message?: string;
  videoUrl?: string;
  portfolioUrl?: string;
  submittedAt: string;
}

export interface DigitalTwin {
  id: string;
  talentId: string;
  modelUrl?: string;
  consentSigned: boolean;
  generatedAt?: string;
}

export interface MasterCode {
  code: string;
  tier: SubscriptionTier;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  revoked: boolean;
}

export interface Contract {
  id: string;
  talentId: string;
  type: string;
  content: string;
  signedAt?: string;
  ipAddress?: string;
}

export interface Earning {
  id: string;
  userId: string;
  amount: number;
  source: string;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
}

export interface AiGeneration {
  id: string;
  userId: string;
  type: AiGenerationType;
  input: string;
  outputUrl?: string;
  status: GenerationStatus;
  cost: number;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  masterCode: string;
  acceptTerms: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
