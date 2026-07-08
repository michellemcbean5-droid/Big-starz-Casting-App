import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env file in backend directory
const envPath = join(__dirname, '../../.env');
if (existsSync(envPath)) {
  config({ path: envPath });
} else {
  config();
}

interface Config {
  env: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiration: string;
  jwtRefreshExpiration: string;
  huggingfaceApiToken: string;
  hfModelText: string;
  hfModelImage: string;
  hfModelVideo: string;
  hfModelStt: string;
  hfModelTts: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripePublishableKey: string;
  s3Bucket: string;
  s3Region: string;
  s3AccessKey: string;
  s3SecretKey: string;
  s3Endpoint: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  corsOrigin: string[];
  logLevel: string;
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || defaultValue!;
}

function getEnvAsNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value ? parseInt(value, 10) : defaultValue!;
}

export const appConfig: Config = {
  env: getEnv('NODE_ENV', 'development'),
  port: getEnvAsNumber('PORT', 3001),
  databaseUrl: getEnv('DATABASE_URL'),
  jwtSecret: getEnv('JWT_SECRET'),
  jwtRefreshSecret: getEnv('JWT_REFRESH_SECRET'),
  jwtAccessExpiration: getEnv('JWT_ACCESS_EXPIRATION', '15m'),
  jwtRefreshExpiration: getEnv('JWT_REFRESH_EXPIRATION', '7d'),
  huggingfaceApiToken: getEnv('HUGGINGFACE_API_TOKEN', ''),
  hfModelText: getEnv('HF_MODEL_TEXT', 'mistralai/Mistral-7B-Instruct-v0.2'),
  hfModelImage: getEnv('HF_MODEL_IMAGE', 'stabilityai/stable-diffusion-xl-base-1.0'),
  hfModelVideo: getEnv('HF_MODEL_VIDEO', 'stabilityai/stable-video-diffusion-img2vid-xt'),
  hfModelStt: getEnv('HF_MODEL_STT', 'openai/whisper-large-v3'),
  hfModelTts: getEnv('HF_MODEL_TTS', 'microsoft/speecht5_tts'),
  stripeSecretKey: getEnv('STRIPE_SECRET_KEY', ''),
  stripeWebhookSecret: getEnv('STRIPE_WEBHOOK_SECRET', ''),
  stripePublishableKey: getEnv('STRIPE_PUBLISHABLE_KEY', ''),
  s3Bucket: getEnv('S3_BUCKET', 'bigstarz-dev'),
  s3Region: getEnv('S3_REGION', 'us-east-1'),
  s3AccessKey: getEnv('S3_ACCESS_KEY', ''),
  s3SecretKey: getEnv('S3_SECRET_KEY', ''),
  s3Endpoint: getEnv('S3_ENDPOINT', ''),
  smtpHost: getEnv('SMTP_HOST', 'smtp.sendgrid.net'),
  smtpPort: getEnvAsNumber('SMTP_PORT', 587),
  smtpUser: getEnv('SMTP_USER', ''),
  smtpPass: getEnv('SMTP_PASS', ''),
  fromEmail: getEnv('FROM_EMAIL', 'noreply@bigstarz.com'),
  rateLimitWindowMs: getEnvAsNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
  rateLimitMaxRequests: getEnvAsNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:3000,http://localhost:3002').split(','),
  logLevel: getEnv('LOG_LEVEL', 'debug'),
};

export default appConfig;
