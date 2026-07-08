#!/usr/bin/env node
/**
 * Shared HuggingFace Inference Client
 * All pipelines use this singleton for HuggingFace API calls.
 * Requires HF_API_TOKEN environment variable.
 */
import { HfInference } from '@huggingface/inference';
import { getEnv } from './config.js';

const token = getEnv('HF_API_TOKEN');
if (!token) {
  console.error('[ERROR] HF_API_TOKEN is not set. Get a free token at https://huggingface.co/settings/tokens');
  process.exit(1);
}

const hf = new HfInference(token);

export default hf;
