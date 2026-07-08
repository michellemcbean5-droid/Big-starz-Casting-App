#!/usr/bin/env node
/**
 * Video Utilities — fluent-ffmpeg wrappers for video processing
 */
import ffmpeg from 'fluent-ffmpeg';
import { getTempPath, ensureDir } from './file-helpers.js';
import { log } from './logger.js';

/**
 * Get video metadata (duration, width, height, etc.)
 */
export function getVideoInfo(inputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      resolve({
        duration: metadata.format.duration,
        width: videoStream?.width,
        height: videoStream?.height,
        fps: videoStream?.r_frame_rate,
        bitrate: metadata.format.bit_rate,
        hasAudio: !!audioStream,
        format: metadata.format.format_name,
      });
    });
  });
}

/**
 * Concatenate multiple video/image clips with transitions
 * @param {Array<{path: string, duration?: number}>} clips
 * @param {string} outputPath
 * @param {Object} options
 */
export async function concatClips(clips, outputPath, options = {}) {
  await ensureDir(require('path').dirname(outputPath));

  const { transition = 'fade', transitionDuration = 0.5, resolution = '1920x1080' } = options;

  // Create a concat demuxer file list
  const listFile = getTempPath(`concat_${Date.now()}.txt`);
  const listContent = clips
    .map(c => `file '${c.path.replace(/'/g, "'\\''")}'\n${c.duration ? `duration ${c.duration}` : ''}`)
    .join('\n');
  await (await import('./file-helpers.js')).writeBuffer(listFile, Buffer.from(listContent, 'utf-8'));

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listFile)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-s', resolution,
      ])
      .on('start', cmd => log('info', `FFmpeg concat: ${cmd}`))
      .on('end', () => {
        log('info', `Concatenated video saved: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', reject)
      .save(outputPath);
  });
}

/**
 * Add audio to a video
 */
export function addAudioToVideo(videoPath, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .input(audioPath)
      .videoCodec('copy')
      .audioCodec('aac')
      .outputOptions(['-shortest'])
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
}

/**
 * Add burn-in subtitles to video
 */
export function addSubtitles(videoPath, srtPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .videoFilter(`subtitles=${srtPath}`)
      .audioCodec('copy')
      .videoCodec('libx264')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
}

/**
 * Extract audio from video for STT processing
 */
export function extractAudio(videoPath, outputAudioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .format('wav')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputAudioPath);
  });
}

/**
 * Trim video segment
 */
export function trimVideo(inputPath, outputPath, startTime, duration) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-pix_fmt', 'yuv420p'])
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
}

/**
 * Resize / scale video
 */
export function resizeVideo(inputPath, outputPath, width, height) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .size(`${width}x${height}`)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-pix_fmt', 'yuv420p'])
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
}

/**
 * Detect silence segments in video (for auto-editing)
 * Returns array of {start, end} silence periods
 */
export function detectSilence(inputPath, silenceThreshold = -50, minSilenceDuration = 0.5) {
  return new Promise((resolve, reject) => {
    const silences = [];
    ffmpeg(inputPath)
      .audioFilter(`silencedetect=noise=${silenceThreshold}dB:d=${minSilenceDuration}`)
      .format('null')
      .output('-')
      .on('stderr', (line) => {
        const startMatch = line.match(/silence_start: ([\d.]+)/);
        const endMatch = line.match(/silence_end: ([\d.]+)/);
        if (startMatch) {
          silences.push({ start: parseFloat(startMatch[1]) });
        }
        if (endMatch && silences.length > 0 && !silences[silences.length - 1].end) {
          silences[silences.length - 1].end = parseFloat(endMatch[1]);
        }
      })
      .on('end', () => resolve(silences))
      .on('error', reject)
      .run();
  });
}

/**
 * Create a slideshow from images with specified durations
 */
export async function createSlideshow(imagePaths, durations, outputPath, options = {}) {
  await ensureDir(require('path').dirname(outputPath));
  const { fps = 30, resolution = '1920x1080', audioPath } = options;

  // Create a complex filter for crossfade transitions
  const inputs = imagePaths.map((p, i) => `[${i}:v]scale=${resolution},fps=${fps},format=yuv420p[img${i}];`).join('');
  let filterComplex = inputs;

  for (let i = 0; i < imagePaths.length; i++) {
    const dur = durations[i] || 3;
    if (i === 0) {
      filterComplex += `[img${i}]trim=duration=${dur}[v${i}];`;
    } else {
      const fadeDuration = 0.5;
      filterComplex += `[v${i - 1}][img${i}]xfade=transition=fade:duration=${fadeDuration}:offset=${durations.slice(0, i).reduce((a, b) => a + b, 0) - fadeDuration * i}[v${i}];`;
    }
  }
  filterComplex += `[v${imagePaths.length - 1}]format=yuv420p[outv]`;

  return new Promise((resolve, reject) => {
    let cmd = ffmpeg();
    imagePaths.forEach(p => cmd = cmd.input(p));
    if (audioPath) cmd = cmd.input(audioPath);

    cmd
      .complexFilter(filterComplex, 'outv')
      .outputOptions(['-map', '[outv]', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'])
      .videoCodec('libx264')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
}
