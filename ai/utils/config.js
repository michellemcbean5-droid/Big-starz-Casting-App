#!/usr/bin/env node
/**
 * Config — environment configuration loader
 */
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Try to load .env from multiple locations
const envPaths = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../.env'),
  resolve(import.meta.dirname || process.cwd(), '../.env'),
];

for (const path of envPaths) {
  if (existsSync(path)) {
    config({ path });
    break;
  }
}

const envCache = new Map();

/**
 * Get environment variable with optional default
 */
export function getEnv(key, defaultValue = undefined) {
  if (envCache.has(key)) return envCache.get(key);

  const value = process.env[key] ?? defaultValue;
  envCache.set(key, value);
  return value;
}

/**
 * Get all HF model names from env
 */
export function getModelConfig() {
  return {
    text: getEnv('HF_MODEL_TEXT', 'mistralai/Mistral-7B-Instruct-v0.2'),
    image: getEnv('HF_MODEL_IMAGE', 'stabilityai/stable-diffusion-xl-base-1.0'),
    video: getEnv('HF_MODEL_VIDEO', 'stabilityai/stable-video-diffusion-img2vid-xt'),
    stt: getEnv('HF_MODEL_STT', 'openai/whisper-large-v3'),
    tts: getEnv('HF_MODEL_TTS', 'microsoft/speecht5_tts'),
    face: getEnv('HF_MODEL_FACE', 'facebook/dinov2-large'),
    embedding: getEnv('HF_MODEL_EMBEDDING', 'sentence-transformers/all-MiniLM-L6-v2'),
  };
}

/**
 * Get safety thresholds
 */
export function getSafetyConfig() {
  return {
    nsfw: parseFloat(getEnv('SAFETY_NSFW_THRESHOLD', '0.7')),
    hate: parseFloat(getEnv('SAFETY_HATE_THRESHOLD', '0.8')),
    violence: parseFloat(getEnv('SAFETY_VIOLENCE_THRESHOLD', '0.7')),
    copyright: parseFloat(getEnv('SAFETY_COPYRIGHT_THRESHOLD', '0.6')),
  };
}
