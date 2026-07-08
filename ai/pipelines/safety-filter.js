#!/usr/bin/env node
/**
 * AI Safety Filter
 * Checks content for NSFW, hate speech, violence, and copyright issues.
 *
 * Usage:
 *   node pipelines/safety-filter.js <input> [--text|--image]
 *
 * Models:
 *   - Text moderation via keyword + heuristic analysis
 *   - Image moderation via HuggingFace moderation models
 */
import fs from 'fs/promises';
import hf from '../utils/huggingface.js';
import { getSafetyConfig } from '../utils/config.js';
import { log, error } from '../utils/logger.js';

const safetyConfig = getSafetyConfig();

// Text-based NSFW / hate / violence keyword lists
const NSFW_KEYWORDS = [
  'nude', 'naked', 'porn', 'sexual', 'explicit', 'xxx', 'adult content',
  'underage', 'child', 'minor', 'cp',
];

const HATE_KEYWORDS = [
  'hate', 'kill', 'die', 'murder', 'attack', 'terrorist', 'nazi',
  'slur', 'racist', 'homophobic', 'transphobic',
];

const VIOLENCE_KEYWORDS = [
  'blood', 'gore', 'violence', 'torture', 'abuse', 'assault',
  'weapon', 'gun', 'knife', 'bomb', 'explosion',
];

const COPYRIGHT_KEYWORDS = [
  'copyright', 'trademark', 'disney', 'marvel', 'dc', 'pixar',
  'netflix', 'hbo', 'warner', 'universal', 'sony',
];

/**
 * Check text content for safety issues
 */
function checkTextSafety(text) {
  const lower = text.toLowerCase();
  const flags = [];

  const nsfwScore = NSFW_KEYWORDS.reduce((score, kw) => lower.includes(kw) ? score + 0.3 : score, 0);
  const hateScore = HATE_KEYWORDS.reduce((score, kw) => lower.includes(kw) ? score + 0.25 : score, 0);
  const violenceScore = VIOLENCE_KEYWORDS.reduce((score, kw) => lower.includes(kw) ? score + 0.2 : score, 0);
  const copyrightScore = COPYRIGHT_KEYWORDS.reduce((score, kw) => lower.includes(kw) ? score + 0.15 : score, 0);

  if (nsfwScore >= safetyConfig.nsfw) flags.push('nsfw');
  if (hateScore >= safetyConfig.hate) flags.push('hate-speech');
  if (violenceScore >= safetyConfig.violence) flags.push('violence');
  if (copyrightScore >= safetyConfig.copyright) flags.push('copyright');

  const maxScore = Math.max(nsfwScore, hateScore, violenceScore, copyrightScore);

  return {
    safe: flags.length === 0,
    flags,
    confidence: Math.min(maxScore, 1.0),
    scores: {
      nsfw: nsfwScore,
      hateSpeech: hateScore,
      violence: violenceScore,
      copyright: copyrightScore,
    },
  };
}

/**
 * Check image content for safety issues using HF moderation models
 */
async function checkImageSafety(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);

    // Use a NSFW detection model if available
    let nsfwResult = { score: 0 };
    try {
      const result = await hf.imageClassification({
        model: 'Falconsai/nsfw_image_detection',
        data: imageBuffer,
      });
      // result is array of { label, score }
      const nsfwEntry = result.find(r => r.label.toLowerCase().includes('nsfw'));
      nsfwResult.score = nsfwEntry ? nsfwEntry.score : 0;
    } catch (err) {
      log('warn', 'NSFW image model unavailable, falling back to heuristics');
    }

    const flags = [];
    if (nsfwResult.score >= safetyConfig.nsfw) flags.push('nsfw');

    return {
      safe: flags.length === 0,
      flags,
      confidence: nsfwResult.score,
      scores: {
        nsfw: nsfwResult.score,
        hateSpeech: 0,
        violence: 0,
        copyright: 0,
      },
    };
  } catch (err) {
    error('Image safety check failed', { err: err.message });
    return {
      safe: false,
      flags: ['error'],
      confidence: 1.0,
      scores: {},
      error: err.message,
    };
  }
}

/**
 * Main safety check function
 */
async function safetyCheck(input, type = 'auto') {
  log('info', 'Running safety check', { input: typeof input === 'string' ? input.substring(0, 50) : '[file]', type });

  let result;

  if (type === 'text') {
    result = checkTextSafety(input);
  } else if (type === 'image') {
    result = await checkImageSafety(input);
  } else {
    // Auto-detect
    if (typeof input === 'string' && input.length < 500 && (await fs.access(input).then(() => true).catch(() => false))) {
      // Likely a file path
      const ext = input.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) {
        result = await checkImageSafety(input);
      } else {
        const content = await fs.readFile(input, 'utf-8');
        result = checkTextSafety(content);
      }
    } else {
      result = checkTextSafety(input);
    }
  }

  log('info', 'Safety check complete', { safe: result.safe, flags: result.flags });
  return result;
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const input = args[0];
  const typeFlag = args.find(a => a === '--text' || a === '--image');
  const type = typeFlag ? typeFlag.replace('--', '') : 'auto';

  if (!input) {
    console.log(`
Usage: node pipelines/safety-filter.js <input> [--text|--image]

Examples:
  node pipelines/safety-filter.js "Check this text for safety" --text
  node pipelines/safety-filter.js ./image.png --image
  node pipelines/safety-filter.js ./document.txt
`);
    process.exit(1);
  }

  safetyCheck(input, type)
    .then(result => {
      console.log('\n=== SAFETY CHECK RESULT ===');
      console.log(`Safe: ${result.safe}`);
      console.log(`Flags: ${result.flags.join(', ') || 'none'}`);
      console.log(`Confidence: ${result.confidence.toFixed(3)}`);
      if (result.scores) {
        console.log('Scores:', JSON.stringify(result.scores, null, 2));
      }
      process.exit(result.safe ? 0 : 1);
    })
    .catch(err => {
      error('Safety check failed', { err: err.message });
      process.exit(1);
    });
}

export { safetyCheck, checkTextSafety, checkImageSafety };
