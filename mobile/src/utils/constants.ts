export const API_BASE_URL = 'http://localhost:3001/api/v1';
export const APP_NAME = 'Big Starz Casting';

export const SUBSCRIPTION_TIERS = {
  free: { name: 'Free', price: 0, aiGenerations: 3, color: '#A0A0B0' },
  bronze: { name: 'Bronze', price: 9.99, aiGenerations: 25, color: '#CD7F32' },
  silver: { name: 'Silver', price: 29.99, aiGenerations: 100, color: '#C0C0C0' },
  gold: { name: 'Gold', price: 99.99, aiGenerations: Infinity, color: '#D4AF37' },
} as const;

export const AI_GENERATION_COSTS = {
  scene: 1,
  reel: 3,
  music_video: 5,
  digital_twin: 10,
} as const;

export const SUPPORTED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp'],
  videos: ['video/mp4', 'video/quicktime', 'video/x-m4v'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/x-m4a'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

export const CASTING_TYPES = [
  { label: 'Film', value: 'film' as const },
  { label: 'TV', value: 'tv' as const },
  { label: 'Commercial', value: 'commercial' as const },
  { label: 'Music Video', value: 'music_video' as const },
  { label: 'Theater', value: 'theater' as const },
  { label: 'Digital', value: 'digital' as const },
] as const;

export const USER_ROLES = [
  { label: 'Talent', value: 'talent' as const },
  { label: 'Casting Director', value: 'casting_director' as const },
  { label: 'Creator', value: 'creator' as const },
] as const;

export const MAX_VIDEO_DURATION = 120; // seconds
export const MAX_FILE_SIZE_MB = 50;

export const CACHE_KEYS = {
  user: 'bigstarz_user',
  tokens: 'bigstarz_tokens',
  theme: 'bigstarz_theme',
  castingCalls: 'bigstarz_casting_cache',
} as const;
