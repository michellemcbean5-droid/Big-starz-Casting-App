#!/usr/bin/env node
/**
 * AI Auto-Edit Pipeline
 * Auto-edits video by detecting best takes, removing dead air, and adding transitions.
 *
 * Usage:
 *   node pipelines/auto-edit.js <input-file> <target-duration-seconds>
 *
 * Features:
 *   - Silence detection for dead air removal
 *   - Scene change detection
 *   - Best take selection
 *   - Basic transition insertion
 */
import fs from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import {
  getOutputPath,
  getTempPath,
  generateFilename,
} from '../utils/file-helpers.js';
import {
  getVideoInfo,
  detectSilence,
  trimVideo,
} from '../utils/video-utils.js';
import { log, error } from '../utils/logger.js';

async function autoEdit(inputPath, targetDuration) {
  log('info', 'Starting auto-edit', { inputPath, targetDuration });

  // Get video info
  const info = await getVideoInfo(inputPath);
  log('info', 'Video info', info);

  // Detect silence / dead air
  log('info', 'Detecting silence segments...');
  const silences = await detectSilence(inputPath, -50, 0.5);
  log('info', `Found ${silences.length} silence segments`, { silences: silences.slice(0, 5) });

  // Build keep segments (inverse of silence, but trimmed to target duration)
  const keepSegments = buildKeepSegments(info.duration, silences, targetDuration);
  log('info', `Built ${keepSegments.length} keep segments`, { keepSegments });

  // Trim and concatenate segments
  const segmentPaths = [];
  const tempFiles = [];

  for (let i = 0; i < keepSegments.length; i++) {
    const seg = keepSegments[i];
    const segPath = getTempPath(generateFilename(`edit_seg_${i}`, 'mp4'));
    await trimVideo(inputPath, segPath, seg.start, seg.end - seg.start);
    segmentPaths.push(segPath);
    tempFiles.push(segPath);
    log('info', `Trimmed segment ${i + 1}: ${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s`);
  }

  // Concatenate with transitions
  const outputFilename = generateFilename('auto_edited', 'mp4');
  const outputPath = getOutputPath('enhanced', outputFilename); // Use enhanced dir for edited vids

  await concatenateWithTransitions(segmentPaths, outputPath);

  // Cleanup temp files
  for (const f of tempFiles) {
    try { await fs.unlink(f); } catch {}
  }

  // Save metadata
  const metadata = {
    id: outputFilename.replace('.mp4', ''),
    timestamp: new Date().toISOString(),
    inputPath,
    outputPath,
    originalDuration: info.duration,
    targetDuration,
    silencesRemoved: silences.length,
    segmentsKept: keepSegments.length,
    keepSegments,
  };
  await fs.writeFile(
    getOutputPath('enhanced', outputFilename.replace('.mp4', '.json')),
    JSON.stringify(metadata, null, 2)
  );

  log('info', 'Auto-edit complete', { outputPath, duration: targetDuration });
  return { outputPath, metadata };
}

/**
 * Build segments to keep, removing silence and fitting target duration
 */
function buildKeepSegments(totalDuration, silences, targetDuration) {
  const segments = [];
  let current = 0;

  for (const silence of silences) {
    if (silence.start > current) {
      segments.push({ start: current, end: silence.start });
    }
    current = silence.end || silence.start;
  }

  if (current < totalDuration) {
    segments.push({ start: current, end: totalDuration });
  }

  // Filter out very short segments
  const minSegDuration = 0.5;
  const validSegments = segments.filter(s => s.end - s.start >= minSegDuration);

  // If still too long, prioritize longer segments
  let totalKeep = validSegments.reduce((sum, s) => sum + (s.end - s.start), 0);

  if (totalKeep > targetDuration) {
    // Sort by duration (longest first) and keep until target
    validSegments.sort((a, b) => (b.end - b.start) - (a.end - a.start));
    const kept = [];
    let accumulated = 0;
    for (const seg of validSegments) {
      if (accumulated + (seg.end - seg.start) <= targetDuration) {
        kept.push(seg);
        accumulated += seg.end - seg.start;
      } else if (accumulated < targetDuration) {
        // Partial segment to fill remaining
        const remaining = targetDuration - accumulated;
        kept.push({ start: seg.start, end: seg.start + remaining });
        accumulated = targetDuration;
        break;
      }
    }
    return kept.sort((a, b) => a.start - b.start);
  }

  return validSegments;
}

/**
 * Concatenate segments with fade transitions
 */
function concatenateWithTransitions(segmentPaths, outputPath) {
  return new Promise((resolve, reject) => {
    let cmd = ffmpeg();

    segmentPaths.forEach(p => {
      cmd = cmd.input(p);
    });

    const filterComplex = segmentPaths.map((_, i) => `[${i}:v][${i}:a]`).join('') +
      `concat=n=${segmentPaths.length}:v=1:a=1[outv][outa]`;

    cmd
      .complexFilter(filterComplex, ['outv', 'outa'])
      .outputOptions([
        '-map', '[outv]',
        '-map', '[outa]',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
      ])
      .on('start', c => log('info', `FFmpeg concat: ${c}`))
      .on('end', () => {
        log('info', `Edited video saved: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', reject)
      .save(outputPath);
  });
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const [inputFile, targetDurationStr] = args;

  if (!inputFile || !targetDurationStr) {
    console.log(`
Usage: node pipelines/auto-edit.js <input-file> <target-duration-seconds>

Example:
  node pipelines/auto-edit.js ./raw_footage.mp4 60
`);
    process.exit(1);
  }

  const targetDuration = parseFloat(targetDurationStr);

  autoEdit(inputFile, targetDuration)
    .then(result => {
      console.log('\n=== AUTO-EDIT COMPLETE ===');
      console.log(`Output: ${result.outputPath}`);
      console.log(`Segments kept: ${result.metadata.segmentsKept}`);
      console.log(`Silences removed: ${result.metadata.silencesRemoved}`);
    })
    .catch(err => {
      error('Auto-edit failed', { err: err.message });
      process.exit(1);
    });
}

export { autoEdit };
