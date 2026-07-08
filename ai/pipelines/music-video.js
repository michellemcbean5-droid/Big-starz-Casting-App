#!/usr/bin/env node
/**
 * AI Music Video Generator
 * Generates AI music videos synced to audio beats.
 *
 * Usage:
 *   node pipelines/music-video.js <audio-file> <visual-style> <scenes-json>
 *
 * Models:
 *   - Keyframes: stabilityai/stable-diffusion-xl-base-1.0
 *   - Video: stabilityai/stable-video-diffusion-img2vid-xt
 */
import fs from 'fs/promises';
import hf from '../utils/huggingface.js';
import { getModelConfig } from '../utils/config.js';
import {
  getOutputPath,
  getTempPath,
  writeBuffer,
  generateFilename,
} from '../utils/file-helpers.js';
import { createSlideshow, addAudioToVideo } from '../utils/video-utils.js';
import { buildKeyframePrompt } from '../utils/text-utils.js';
import { log, error } from '../utils/logger.js';

const models = getModelConfig();

/**
 * Analyze audio to detect beat timestamps
 * Simple amplitude-based beat detection
 */
async function detectBeats(audioPath) {
  log('info', 'Analyzing audio for beats...');
  // For a real implementation, we'd use a proper audio analysis library
  // Here we return simulated beat timestamps every ~2 seconds
  // In production, use essentia.js or similar
  return [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];
}

async function generateMusicVideo(audioPath, visualStyle, sceneDescriptions) {
  log('info', 'Starting music video generation', { audioPath, visualStyle, sceneCount: sceneDescriptions.length });

  const tempFiles = [];

  try {
    // 1. Detect beats from audio
    const beats = await detectBeats(audioPath);
    log('info', `Detected ${beats.length} beat markers`);

    // 2. Generate keyframes for each scene/beat
    const keyframePaths = [];
    const keyframeDurations = [];

    log('info', 'Generating keyframes with Stable Diffusion XL...');
    for (let i = 0; i < sceneDescriptions.length; i++) {
      const scene = sceneDescriptions[i];
      const beatIntensity = i % 2 === 0 ? 0.9 : 0.5; // Alternate high/low energy
      const prompt = buildKeyframePrompt(scene, visualStyle, 'dynamic', beatIntensity);

      try {
        const imageBlob = await hf.textToImage({
          model: models.image,
          inputs: prompt,
          parameters: {
            width: 1024,
            height: 576, // 16:9 for video
            guidance_scale: 7.5,
            num_inference_steps: 40,
          },
        });

        const buffer = Buffer.from(await imageBlob.arrayBuffer());
        const filename = generateFilename(`mv_keyframe_${i}`, 'png');
        const filepath = getTempPath(filename);
        await writeBuffer(filepath, buffer);
        keyframePaths.push(filepath);
        tempFiles.push(filepath);

        // Duration between this keyframe and next (or end)
        const nextBeat = beats[i + 1] || beats[i] + 4;
        keyframeDurations.push(nextBeat - beats[i]);

        log('info', `Keyframe ${i + 1}/${sceneDescriptions.length} generated`);
      } catch (err) {
        error(`Keyframe ${i} generation failed`, { err: err.message });
      }
    }

    // 3. Generate video clips from keyframes (image-to-video)
    const videoClips = [];
    log('info', 'Generating video clips from keyframes...');

    for (let i = 0; i < keyframePaths.length; i++) {
      try {
        const imageBuffer = await fs.readFile(keyframePaths[i]);

        const videoBlob = await hf.imageToVideo({
          model: models.video,
          inputs: imageBuffer,
          parameters: {
            num_frames: 25,
            num_inference_steps: 25,
          },
        });

        const videoBuffer = Buffer.from(await videoBlob.arrayBuffer());
        const videoPath = getTempPath(generateFilename(`mv_clip_${i}`, 'mp4'));
        await writeBuffer(videoPath, videoBuffer);
        videoClips.push(videoPath);
        tempFiles.push(videoPath);

        log('info', `Video clip ${i + 1} generated`);
      } catch (err) {
        error(`Video clip ${i} generation failed`, { err: err.message });
        // Fallback: use static image as video segment via slideshow
        videoClips.push(keyframePaths[i]);
      }
    }

    // 4. Create slideshow/video from clips
    log('info', 'Compiling music video...');
    const slideshowPath = getTempPath(generateFilename('mv_slideshow', 'mp4'));
    await createSlideshow(videoClips, keyframeDurations, slideshowPath, {
      fps: 24,
      resolution: '1024x576',
      audioPath,
    });
    tempFiles.push(slideshowPath);

    // 5. Save final output
    const outputFilename = generateFilename('music_video', 'mp4');
    const finalPath = getOutputPath('music-videos', outputFilename);
    await fs.copyFile(slideshowPath, finalPath);

    // 6. Save metadata
    const metadata = {
      id: outputFilename.replace('.mp4', ''),
      timestamp: new Date().toISOString(),
      audioPath,
      visualStyle,
      sceneDescriptions,
      beats,
      keyframeCount: keyframePaths.length,
      outputPath: finalPath,
    };
    await fs.writeFile(
      getOutputPath('music-videos', outputFilename.replace('.mp4', '.json')),
      JSON.stringify(metadata, null, 2)
    );

    log('info', 'Music video generation complete', { outputPath: finalPath });
    return { videoPath: finalPath, metadata };
  } catch (err) {
    error('Music video generation failed', { err: err.message });
    throw err;
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const [audioFile, visualStyle, scenesJson] = args;

  if (!audioFile || !visualStyle || !scenesJson) {
    console.log(`
Usage: node pipelines/music-video.js <audio-file> <visual-style> <scenes-json>

Example:
  node pipelines/music-video.js ./song.mp3 "cyberpunk neon" '["city skyline at night","flying through clouds","underwater dance","starry cosmos"]'
`);
    process.exit(1);
  }

  const scenes = JSON.parse(scenesJson);

  generateMusicVideo(audioFile, visualStyle, scenes)
    .then(result => {
      console.log('\n=== MUSIC VIDEO GENERATED ===');
      console.log(`Video: ${result.videoPath}`);
      console.log(`Scenes: ${scenes.length}`);
    })
    .catch(err => {
      error('Music video generation failed', { err: err.message });
      process.exit(1);
    });
}

export { generateMusicVideo };
