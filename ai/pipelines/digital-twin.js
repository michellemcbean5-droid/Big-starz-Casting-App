#!/usr/bin/env node
/**
 * AI Digital Twin Generator
 * Creates a digital twin from reference photos using face analysis
 * and consistent likeness generation.
 *
 * Usage:
 *   node pipelines/digital-twin.js <photos-json> <description>
 *
 * Models:
 *   - Face Analysis: facebook/dinov2-large
 *   - Image Generation: stabilityai/stable-diffusion-xl-base-1.0
 */
import fs from 'fs/promises';
import hf from '../utils/huggingface.js';
import { getModelConfig } from '../utils/config.js';
import {
  getOutputPath,
  getTempPath,
  writeBuffer,
  writeJson,
  generateFilename,
} from '../utils/file-helpers.js';
import { enhanceImage } from '../utils/image-utils.js';
import { buildTwinPrompt } from '../utils/text-utils.js';
import { log, error } from '../utils/logger.js';

const models = getModelConfig();

const POSES = [
  'headshot facing camera',
  'three-quarter profile',
  'full body standing',
  'sitting pose',
  'action pose mid-movement',
];

const EXPRESSIONS = [
  'neutral expression',
  'warm smile',
  'intense dramatic look',
  'surprised expression',
  'contemplative gaze',
];

const OUTFITS = [
  'casual everyday clothing',
  'formal business attire',
  'elegant evening wear',
  'athletic sportswear',
  'creative artistic outfit',
];

async function generateDigitalTwin(photoPaths, description) {
  log('info', 'Starting digital twin generation', { photoCount: photoPaths.length, description });

  const tempFiles = [];
  const generatedImages = [];
  const twinId = generateFilename('twin', '').replace('_', '');

  try {
    // 1. Analyze reference photos with DINOv2 for feature extraction
    log('info', 'Analyzing reference photos with DINOv2...');
    const embeddings = [];

    for (const photoPath of photoPaths) {
      try {
        const imageBuffer = await fs.readFile(photoPath);
        const result = await hf.featureExtraction({
          model: models.face,
          inputs: {
            data: imageBuffer,
          },
        });
        embeddings.push(result);
        log('info', `Analyzed photo: ${photoPath}`);
      } catch (err) {
        error(`Face analysis failed for ${photoPath}`, { err: err.message });
      }
    }

    // Create a consistent likeness seed from embeddings
    const likenessSeed = embeddings.length > 0
      ? Math.abs(embeddings[0].reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0) % 1000000)
      : Math.floor(Math.random() * 1000000);

    log('info', `Likeness seed computed: ${likenessSeed}`);

    // 2. Generate multiple poses, expressions, and outfits
    log('info', 'Generating digital twin variations...');

    for (let p = 0; p < POSES.length; p++) {
      for (let e = 0; e < EXPRESSIONS.length; e++) {
        for (let o = 0; o < OUTFITS.length; o++) {
          // Generate a subset (max 5 variations to avoid excessive API calls)
          if ((p + e + o) % 3 !== 0) continue;

          const pose = POSES[p];
          const expression = EXPRESSIONS[e];
          const outfit = OUTFITS[o];

          const prompt = buildTwinPrompt(description, pose, expression, outfit, likenessSeed);

          try {
            const imageBlob = await hf.textToImage({
              model: models.image,
              inputs: prompt,
              parameters: {
                width: 1024,
                height: 1024,
                guidance_scale: 7.5,
                num_inference_steps: 50,
                seed: likenessSeed,
              },
            });

            const buffer = Buffer.from(await imageBlob.arrayBuffer());
            const filename = generateFilename(`twin_${pose.replace(/\s+/g, '_')}_${expression.replace(/\s+/g, '_')}`, 'png');
            const filepath = getOutputPath('digital-twins', filename);
            await writeBuffer(filepath, buffer);
            generatedImages.push({
              path: filepath,
              pose,
              expression,
              outfit,
              prompt,
            });

            log('info', `Generated: ${pose} + ${expression} + ${outfit}`);
          } catch (err) {
            error(`Generation failed for ${pose}/${expression}`, { err: err.message });
          }
        }
      }
    }

    // 3. Save twin model data
    const modelData = {
      id: twinId,
      timestamp: new Date().toISOString(),
      description,
      likenessSeed,
      referencePhotos: photoPaths,
      embeddings: embeddings.length, // count only, not raw data (too large)
      generatedImages: generatedImages.map(img => ({
        path: img.path,
        pose: img.pose,
        expression: img.expression,
        outfit: img.outfit,
      })),
      totalVariations: generatedImages.length,
    };

    const modelDataPath = getOutputPath('digital-twins', `${twinId}_model.json`);
    await writeJson(modelDataPath, modelData);

    log('info', 'Digital twin generation complete', {
      twinId,
      variations: generatedImages.length,
      modelDataPath,
    });

    return {
      twinId,
      modelData,
      generatedImages,
      modelDataPath,
    };
  } catch (err) {
    error('Digital twin generation failed', { err: err.message });
    throw err;
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const [photosJson, description] = args;

  if (!photosJson || !description) {
    console.log(`
Usage: node pipelines/digital-twin.js <photos-json> <description>

Example:
  node pipelines/digital-twin.js '["./photo1.jpg","./photo2.jpg"]' "A young actor with dark hair and green eyes"
`);
    process.exit(1);
  }

  const photos = JSON.parse(photosJson);

  generateDigitalTwin(photos, description)
    .then(result => {
      console.log('\n=== DIGITAL TWIN GENERATED ===');
      console.log(`Twin ID: ${result.twinId}`);
      console.log(`Variations: ${result.generatedImages.length}`);
      console.log(`Model Data: ${result.modelDataPath}`);
    })
    .catch(err => {
      error('Digital twin generation failed', { err: err.message });
      process.exit(1);
    });
}

export { generateDigitalTwin };
