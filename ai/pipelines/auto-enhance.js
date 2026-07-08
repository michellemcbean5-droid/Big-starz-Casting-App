#!/usr/bin/env node
/**
 * AI Auto-Enhancement Pipeline
 * Enhances media with color correction, sharpening, and noise reduction.
 *
 * Usage:
 *   node pipelines/auto-enhance.js <input-file> [options-json]
 *
 * Supports images (via sharp) and videos (via ffmpeg).
 */
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import {
  getOutputPath,
  getTempPath,
  generateFilename,
} from '../utils/file-helpers.js';
import { enhanceImage } from '../utils/image-utils.js';
import { log, error } from '../utils/logger.js';

async function autoEnhance(inputPath, options = {}) {
  log('info', 'Starting auto-enhancement', { inputPath, options });

  const ext = path.extname(inputPath).toLowerCase();
  const isVideo = ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext);
  const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp'].includes(ext);

  if (!isVideo && !isImage) {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  const outputFilename = generateFilename('enhanced', isVideo ? 'mp4' : 'png');
  const outputPath = getOutputPath('enhanced', outputFilename);

  if (isImage) {
    // Image enhancement via sharp
    await enhanceImage(inputPath, outputPath, {
      sharpen: options.sharpen !== false,
      sharpenSigma: options.sharpenSigma || 1.5,
      colorCorrect: options.colorCorrect !== false,
      brightness: options.brightness || 1.05,
      saturation: options.saturation || 1.1,
      denoise: options.denoise || false,
      denoiseRadius: options.denoiseRadius || 1,
    });
  } else {
    // Video enhancement via ffmpeg filters
    await enhanceVideo(inputPath, outputPath, options);
  }

  // Save metadata
  const metadata = {
    id: outputFilename.replace(/\.(mp4|png)$/, ''),
    timestamp: new Date().toISOString(),
    inputPath,
    outputPath,
    options,
    type: isVideo ? 'video' : 'image',
  };
  await fs.writeFile(
    getOutputPath('enhanced', outputFilename.replace(/\.(mp4|png)$/, '.json')),
    JSON.stringify(metadata, null, 2)
  );

  log('info', 'Auto-enhancement complete', { outputPath });
  return { outputPath, metadata };
}

function enhanceVideo(inputPath, outputPath, options) {
  return new Promise((resolve, reject) => {
    const filters = [];

    // Sharpen / unsharp mask
    if (options.sharpen !== false) {
      filters.push('unsharp=5:5:1.0:5:5:0.0');
    }

    // Color correction (eq filter)
    const eqParams = [];
    if (options.brightness) eqParams.push(`brightness=${options.brightness - 1}`);
    if (options.saturation) eqParams.push(`saturation=${options.saturation}`);
    if (options.contrast) eqParams.push(`contrast=${options.contrast}`);
    if (eqParams.length > 0) {
      filters.push(`eq=${eqParams.join(':')}`);
    }

    // Denoise
    if (options.denoise) {
      filters.push('hqdn3d=4:4:6:6');
    }

    // Stabilization (optional)
    if (options.stabilize) {
      filters.push('deshake');
    }

    ffmpeg(inputPath)
      .videoFilter(filters.length > 0 ? filters.join(',') : 'copy')
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-preset', options.preset || 'medium',
        '-crf', String(options.crf || 23),
      ])
      .on('start', cmd => log('info', `FFmpeg enhance: ${cmd}`))
      .on('end', () => {
        log('info', `Enhanced video saved: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', reject)
      .save(outputPath);
  });
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const [inputFile, optionsJson = '{}'] = args;

  if (!inputFile) {
    console.log(`
Usage: node pipelines/auto-enhance.js <input-file> [options-json]

Options (JSON):
  sharpen        - Apply sharpening (default: true)
  colorCorrect   - Apply color correction (default: true)
  brightness     - Brightness multiplier (default: 1.05)
  saturation     - Saturation multiplier (default: 1.1)
  denoise        - Apply noise reduction (default: false)
  stabilize      - Apply video stabilization (default: false)

Example:
  node pipelines/auto-enhance.js ./photo.jpg '{"sharpen":true,"denoise":true}'
`);
    process.exit(1);
  }

  const options = JSON.parse(optionsJson);

  autoEnhance(inputFile, options)
    .then(result => {
      console.log('\n=== ENHANCEMENT COMPLETE ===');
      console.log(`Output: ${result.outputPath}`);
    })
    .catch(err => {
      error('Enhancement failed', { err: err.message });
      process.exit(1);
    });
}

export { autoEnhance };
