#!/usr/bin/env node
/**
 * Text Utilities — prompt engineering, text processing helpers
 */

/**
 * Build a structured prompt for scene generation
 */
export function buildScenePrompt(description, genre, characterName, emotion) {
  return `Generate an acting scene with the following details:

SCENE DESCRIPTION: ${description}
GENRE: ${genre}
CHARACTER: ${characterName}
EMOTION: ${emotion}

Please provide:
1. A full script with dialogue
2. Stage directions
3. Emotional beats
4. Camera suggestions

Format the response as structured text.`;
}

/**
 * Build an image generation prompt from scene context
 */
export function buildImagePrompt(sceneDescription, genre, emotion, style = 'cinematic') {
  const prompts = [
    `${style} film still`,
    genre,
    sceneDescription,
    `character expressing ${emotion}`,
    'high quality, professional lighting, 4k, detailed',
  ];
  return prompts.filter(Boolean).join(', ');
}

/**
 * Build a digital twin generation prompt
 */
export function buildTwinPrompt(description, pose, expression, outfit, likenessSeed) {
  return `Professional portrait photo of ${description}, ${pose}, ${expression}, wearing ${outfit}, studio lighting, high quality, detailed face, consistent likeness seed ${likenessSeed}, 4k`;
}

/**
 * Build a music video keyframe prompt
 */
export function buildKeyframePrompt(sceneDesc, visualStyle, mood, beatIntensity) {
  return `${visualStyle} visual, ${sceneDesc}, ${mood} atmosphere, dynamic composition, ${beatIntensity > 0.7 ? 'high energy' : 'smooth flow'}, cinematic, 4k`;
}

/**
 * Parse Mistral response into structured scene data
 */
export function parseSceneResponse(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const script = [];
  const stageDirections = [];
  const dialogue = [];

  let currentSection = 'script';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('stage direction') || lower.includes('stage directions')) {
      currentSection = 'stageDirections';
      continue;
    }
    if (lower.includes('dialogue') || lower.includes('dialogue:')) {
      currentSection = 'dialogue';
      continue;
    }
    if (lower.includes('script') || lower.includes('scene')) {
      currentSection = 'script';
      continue;
    }

    if (line.startsWith('-') || line.match(/^[A-Z][A-Z\s]+:/)) {
      if (currentSection === 'dialogue' || line.match(/^[A-Z][A-Z\s]+:/)) {
        dialogue.push(line);
      } else if (currentSection === 'stageDirections' || line.startsWith('(')) {
        stageDirections.push(line);
      } else {
        script.push(line);
      }
    } else {
      script.push(line);
    }
  }

  return {
    script: script.join('\n'),
    dialogue: dialogue.join('\n'),
    stageDirections: stageDirections.join('\n'),
    raw: text,
  };
}

/**
 * Generate SRT subtitle content from transcription segments
 * @param {Array<{start: number, end: number, text: string}>} segments
 */
export function generateSrt(segments) {
  return segments.map((seg, i) => {
    const start = formatSrtTime(seg.start);
    const end = formatSrtTime(seg.end);
    return `${i + 1}\n${start} --> ${end}\n${seg.text}\n`;
  }).join('\n');
}

function formatSrtTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Truncate text to max length with ellipsis
 */
export function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Sanitize string for use in filenames
 */
export function sanitizeFilename(str) {
  return str.replace(/[^a-z0-9_-]/gi, '_').substring(0, 50);
}

/**
 * Build a reel narration script from talent info
 */
export function buildReelNarration(talentName, skills) {
  const skillList = Array.isArray(skills) ? skills.join(', ') : skills;
  return `Introducing ${talentName}. A versatile performer with expertise in ${skillList}. Watch as they bring characters to life with passion, precision, and undeniable talent. This is ${talentName}. Ready for the spotlight.`;
}
