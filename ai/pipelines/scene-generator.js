#!/usr/bin/env node
/**
 * AI Scene Generator
 * Generates AI acting scenes with script, dialogue, and imagery.
 *
 * Usage:
 *   node pipelines/scene-generator.js "A detective interrogates a suspect" "thriller" "Detective Miller" "tense"
 *
 * Models:
 *   - Text: mistralai/Mistral-7B-Instruct-v0.2
 *   - Image: stabilityai/stable-diffusion-xl-base-1.0
 */
import hf from '../utils/huggingface.js';
import { getModelConfig } from '../utils/config.js';
import {
  getOutputPath,
  writeJson,
  writeBuffer,
  generateFilename,
} from '../utils/file-helpers.js';
import {
  buildScenePrompt,
  buildImagePrompt,
  parseSceneResponse,
} from '../utils/text-utils.js';
import { log, error } from '../utils/logger.js';

const models = getModelConfig();

async function generateScene(sceneDescription, genre, characterName, emotion) {
  log('info', 'Starting scene generation', { sceneDescription, genre, characterName, emotion });

  // 1. Generate script and dialogue with Mistral
  const textPrompt = buildScenePrompt(sceneDescription, genre, characterName, emotion);
  log('info', 'Generating script with Mistral...');

  let scriptData;
  try {
    const textResult = await hf.textGeneration({
      model: models.text,
      inputs: `<s>[INST] ${textPrompt} [/INST]`,
      parameters: {
        max_new_tokens: 1024,
        temperature: 0.7,
        return_full_text: false,
      },
    });

    scriptData = parseSceneResponse(textResult.generated_text || '');
    log('info', 'Script generated successfully');
  } catch (err) {
    error('Text generation failed', { err: err.message });
    scriptData = { script: '', dialogue: '', stageDirections: '', raw: '' };
  }

  // 2. Generate scene imagery with Stable Diffusion XL
  const imagePrompt = buildImagePrompt(sceneDescription, genre, emotion, 'cinematic');
  log('info', 'Generating scene image...');

  const imageUrls = [];
  const imageBuffers = [];

  try {
    // Generate 3 variations
    for (let i = 0; i < 3; i++) {
      const imageBlob = await hf.textToImage({
        model: models.image,
        inputs: `${imagePrompt}, variation ${i + 1}`,
        parameters: {
          width: 1024,
          height: 1024,
          guidance_scale: 7.5,
          num_inference_steps: 50,
        },
      });

      const buffer = Buffer.from(await imageBlob.arrayBuffer());
      const filename = generateFilename(`scene_${i + 1}`, 'png');
      const filepath = getOutputPath('scenes', filename);
      await writeBuffer(filepath, buffer);
      imageUrls.push(filepath);
      imageBuffers.push(buffer);
    }
    log('info', 'Scene images generated', { count: imageUrls.length });
  } catch (err) {
    error('Image generation failed', { err: err.message });
  }

  // 3. Compile output
  const output = {
    id: generateFilename('scene', 'json').replace('.json', ''),
    timestamp: new Date().toISOString(),
    input: { sceneDescription, genre, characterName, emotion },
    script: scriptData.script,
    dialogue: scriptData.dialogue,
    stageDirections: scriptData.stageDirections,
    imageUrls,
    rawText: scriptData.raw,
  };

  const jsonPath = getOutputPath('scenes', generateFilename('scene', 'json'));
  await writeJson(jsonPath, output);

  log('info', 'Scene generation complete', { outputPath: jsonPath });
  return output;
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const [description, genre, characterName, emotion] = args;

  if (!description || !genre || !characterName || !emotion) {
    console.log(`
Usage: node pipelines/scene-generator.js <description> <genre> <character> <emotion>

Example:
  node pipelines/scene-generator.js "A detective interrogates a suspect" "thriller" "Detector Miller" "tense"
`);
    process.exit(1);
  }

  generateScene(description, genre, characterName, emotion)
    .then(result => {
      console.log('\n=== SCENE GENERATED ===');
      console.log(`ID: ${result.id}`);
      console.log(`Images: ${result.imageUrls.length}`);
      console.log(`Script length: ${result.script.length} chars`);
      console.log(`Output: ${getOutputPath('scenes', result.id + '.json')}`);
    })
    .catch(err => {
      error('Scene generation failed', { err: err.message });
      process.exit(1);
    });
}

export { generateScene };
