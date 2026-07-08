#!/usr/bin/env node
/**
 * AI Reel Generator
 * Generates casting reels with narration, subtitles, and transitions.
 *
 * Usage:
 *   node pipelines/reel-generator.js <talent-name> <skills-json> <clips-json> <style>
 *
 * Models:
 *   - TTS: microsoft/speecht5_tts
 *   - STT/Subtitles: openai/whisper-large-v3
 */
import fs from 'fs/promises';
import path from 'path';
import hf from '../utils/huggingface.js';
import { getModelConfig } from '../utils/config.js';
import {
  getOutputPath,
  getTempPath,
  writeBuffer,
  generateFilename,
} from '../utils/file-helpers.js';
import {
  concatClips,
  extractAudio,
  addAudioToVideo,
  addSubtitles,
} from '../utils/video-utils.js';
import { generateSrt, buildReelNarration } from '../utils/text-utils.js';
import { log, error } from '../utils/logger.js';

const models = getModelConfig();

async function generateReel(talentName, skills, clips, style = 'cinematic') {
  log('info', 'Starting reel generation', { talentName, style, clipCount: clips.length });

  const tempFiles = [];

  try {
    // 1. Generate narration script
    const narrationText = buildReelNarration(talentName, skills);
    log('info', 'Narration script generated', { text: narrationText.substring(0, 100) });

    // 2. Generate voiceover with SpeechT5 TTS
    // Note: SpeechT5 requires speaker embeddings; we use a default approach
    log('info', 'Generating voiceover with SpeechT5...');
    let audioPath;
    try {
      const ttsResult = await hf.textToSpeech({
        model: models.tts,
        inputs: narrationText,
      });
      const audioBuffer = Buffer.from(await ttsResult.arrayBuffer());
      audioPath = getTempPath(generateFilename('reel_audio', 'wav'));
      await writeBuffer(audioPath, audioBuffer);
      tempFiles.push(audioPath);
      log('info', 'Voiceover generated', { path: audioPath });
    } catch (err) {
      error('TTS generation failed', { err: err.message });
      audioPath = null;
    }

    // 3. Concatenate clips with transitions
    log('info', 'Compiling clips...');
    const clipObjects = clips.map(c => ({
      path: path.resolve(c),
      duration: 3,
    }));

    const compiledVideoPath = getTempPath(generateFilename('reel_compiled', 'mp4'));
    await concatClips(clipObjects, compiledVideoPath, {
      transition: 'fade',
      transitionDuration: 0.5,
      resolution: '1920x1080',
    });
    tempFiles.push(compiledVideoPath);
    log('info', 'Clips compiled', { path: compiledVideoPath });

    // 4. Add voiceover audio to video
    let finalVideoPath = compiledVideoPath;
    if (audioPath) {
      const withAudioPath = getTempPath(generateFilename('reel_with_audio', 'mp4'));
      await addAudioToVideo(compiledVideoPath, audioPath, withAudioPath);
      tempFiles.push(withAudioPath);
      finalVideoPath = withAudioPath;
      log('info', 'Audio added to reel');
    }

    // 5. Generate subtitles from narration using Whisper
    let subtitlePath;
    try {
      log('info', 'Generating subtitles with Whisper...');

      // Whisper needs audio input
      const whisperAudioPath = audioPath || getTempPath(generateFilename('reel_whisper', 'wav'));
      if (!audioPath) {
        await extractAudio(finalVideoPath, whisperAudioPath);
        tempFiles.push(whisperAudioPath);
      }

      const whisperResult = await hf.automaticSpeechRecognition({
        model: models.stt,
        data: await fs.readFile(whisperAudioPath),
      });

      // Build subtitle segments
      const segments = whisperResult.chunks
        ? whisperResult.chunks.map(c => ({
            start: c.timestamp[0],
            end: c.timestamp[1] || c.timestamp[0] + 3,
            text: c.text,
          }))
        : [{ start: 0, end: 5, text: narrationText }];

      const srtContent = generateSrt(segments);
      subtitlePath = getOutputPath('reels', generateFilename('reel', 'srt'));
      await writeBuffer(subtitlePath, Buffer.from(srtContent, 'utf-8'));
      log('info', 'Subtitles generated', { path: subtitlePath });

      // Burn subtitles into video
      const withSubtitlesPath = getTempPath(generateFilename('reel_subbed', 'mp4'));
      await addSubtitles(finalVideoPath, subtitlePath, withSubtitlesPath);
      tempFiles.push(withSubtitlesPath);
      finalVideoPath = withSubtitlesPath;
      log('info', 'Subtitles burned into video');
    } catch (err) {
      error('Subtitle generation failed', { err: err.message });
      subtitlePath = null;
    }

    // 6. Save final reel
    const outputFilename = generateFilename(`reel_${talentName.replace(/\s+/g, '_')}`, 'mp4');
    const finalOutputPath = getOutputPath('reels', outputFilename);
    await fs.copyFile(finalVideoPath, finalOutputPath);

    // 7. Save metadata
    const metadata = {
      id: outputFilename.replace('.mp4', ''),
      timestamp: new Date().toISOString(),
      talentName,
      skills,
      style,
      clips,
      narrationText,
      outputPath: finalOutputPath,
      subtitlePath,
      hasAudio: !!audioPath,
      hasSubtitles: !!subtitlePath,
    };
    await fs.writeFile(
      getOutputPath('reels', outputFilename.replace('.mp4', '.json')),
      JSON.stringify(metadata, null, 2)
    );

    log('info', 'Reel generation complete', { outputPath: finalOutputPath });

    return {
      videoPath: finalOutputPath,
      subtitlePath,
      metadata,
    };
  } catch (err) {
    error('Reel generation failed', { err: err.message });
    throw err;
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const [talentName, skillsJson, clipsJson, style = 'cinematic'] = args;

  if (!talentName || !skillsJson || !clipsJson) {
    console.log(`
Usage: node pipelines/reel-generator.js <talent-name> <skills-json> <clips-json> [style]

Example:
  node pipelines/reel-generator.js "Jane Doe" '["acting","singing","dance"]' '["./clip1.mp4","./clip2.jpg"]'
`);
    process.exit(1);
  }

  const skills = JSON.parse(skillsJson);
  const clips = JSON.parse(clipsJson);

  generateReel(talentName, skills, clips, style)
    .then(result => {
      console.log('\n=== REEL GENERATED ===');
      console.log(`Video: ${result.videoPath}`);
      console.log(`Subtitles: ${result.subtitlePath || 'N/A'}`);
    })
    .catch(err => {
      error('Reel generation failed', { err: err.message });
      process.exit(1);
    });
}

export { generateReel };
