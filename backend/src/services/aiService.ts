import { spawn } from 'child_process';
import path from 'path';

const AI_DIR = path.resolve(__dirname, '../../../ai');

interface SpawnResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Spawn a Node.js pipeline script with JSON arguments via stdin.
 * Returns parsed stdout as JSON.
 */
function runPipeline(scriptPath: string, args: string[]): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath, ...args], {
      cwd: AI_DIR,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode: exitCode ?? 0 });
    });
  });
}

/**
 * Parse JSON result from pipeline stdout.
 * Looks for the last JSON object in the output.
 */
function parsePipelineOutput(stdout: string): Record<string, unknown> {
  // Try to find a JSON object in the output
  const lines = stdout.split('\n').filter((l) => l.trim());
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        return JSON.parse(line) as Record<string, unknown>;
      } catch {
        // Not valid JSON, continue
      }
    }
  }

  // Fallback: try to parse the whole stdout as JSON
  try {
    return JSON.parse(stdout) as Record<string, unknown>;
  } catch {
    // Return empty result
    return {};
  }
}

/**
 * Extract structured result from pipeline output based on the script's output format.
 */
function extractResult(stdout: string, _stderr: string): Record<string, unknown> {
  const parsed = parsePipelineOutput(stdout);
  if (Object.keys(parsed).length > 0) {
    return parsed;
  }

  // Fallback: parse lines like "Video: /path" or "Output: /path"
  const result: Record<string, unknown> = {};
  const outputLine = stdout.split('\n').find((l) => l.trim().startsWith('Output:'));
  if (outputLine) {
    result.outputPath = outputLine.split('Output:')[1].trim();
  }

  const videoLine = stdout.split('\n').find((l) => l.trim().startsWith('Video:'));
  if (videoLine) {
    result.videoPath = videoLine.split('Video:')[1].trim();
  }

  const idLine = stdout.split('\n').find((l) => l.trim().startsWith('ID:'));
  if (idLine) {
    result.id = idLine.split('ID:')[1].trim();
  }

  return result;
}

export interface GenerateSceneParams {
  description: string;
  genre: string;
  characterName: string;
  emotion: string;
}

export async function generateScene(params: GenerateSceneParams): Promise<Record<string, unknown>> {
  const scriptPath = path.join(AI_DIR, 'pipelines', 'scene-generator.js');
  const { stdout, stderr, exitCode } = await runPipeline(scriptPath, [
    params.description,
    params.genre,
    params.characterName,
    params.emotion,
  ]);

  if (exitCode !== 0) {
    throw new Error(`Scene generation pipeline failed: ${stderr || stdout}`);
  }

  return extractResult(stdout, stderr);
}

export interface GenerateReelParams {
  talentName: string;
  skills: string[];
  clips: string[];
  style?: string;
}

export async function generateReel(params: GenerateReelParams): Promise<Record<string, unknown>> {
  const scriptPath = path.join(AI_DIR, 'pipelines', 'reel-generator.js');
  const { stdout, stderr, exitCode } = await runPipeline(scriptPath, [
    params.talentName,
    JSON.stringify(params.skills),
    JSON.stringify(params.clips),
    params.style || 'cinematic',
  ]);

  if (exitCode !== 0) {
    throw new Error(`Reel generation pipeline failed: ${stderr || stdout}`);
  }

  return extractResult(stdout, stderr);
}

export interface GenerateMusicVideoParams {
  audioFile: string;
  visualStyle: string;
  sceneDescriptions: string[];
}

export async function generateMusicVideo(params: GenerateMusicVideoParams): Promise<Record<string, unknown>> {
  const scriptPath = path.join(AI_DIR, 'pipelines', 'music-video.js');
  const { stdout, stderr, exitCode } = await runPipeline(scriptPath, [
    params.audioFile,
    params.visualStyle,
    JSON.stringify(params.sceneDescriptions),
  ]);

  if (exitCode !== 0) {
    throw new Error(`Music video generation pipeline failed: ${stderr || stdout}`);
  }

  return extractResult(stdout, stderr);
}

export interface GenerateDigitalTwinParams {
  referencePhotos: string[];
  description: string;
}

export async function generateDigitalTwin(params: GenerateDigitalTwinParams): Promise<Record<string, unknown>> {
  const scriptPath = path.join(AI_DIR, 'pipelines', 'digital-twin.js');
  const { stdout, stderr, exitCode } = await runPipeline(scriptPath, [
    JSON.stringify(params.referencePhotos),
    params.description,
  ]);

  if (exitCode !== 0) {
    throw new Error(`Digital twin generation pipeline failed: ${stderr || stdout}`);
  }

  return extractResult(stdout, stderr);
}

export interface AutoEnhanceParams {
  filePath: string;
  options?: Record<string, unknown>;
}

export async function autoEnhance(params: AutoEnhanceParams): Promise<Record<string, unknown>> {
  const scriptPath = path.join(AI_DIR, 'pipelines', 'auto-enhance.js');
  const args = [params.filePath];
  if (params.options && Object.keys(params.options).length > 0) {
    args.push(JSON.stringify(params.options));
  }

  const { stdout, stderr, exitCode } = await runPipeline(scriptPath, args);

  if (exitCode !== 0) {
    throw new Error(`Auto-enhance pipeline failed: ${stderr || stdout}`);
  }

  return extractResult(stdout, stderr);
}

export interface WatermarkParams {
  filePath: string;
  text?: string;
}

export async function watermark(params: WatermarkParams): Promise<Record<string, unknown>> {
  const scriptPath = path.join(AI_DIR, 'pipelines', 'watermark.js');
  const args = [params.filePath];
  if (params.text) {
    args.push(params.text);
  }

  const { stdout, stderr, exitCode } = await runPipeline(scriptPath, args);

  if (exitCode !== 0) {
    throw new Error(`Watermark pipeline failed: ${stderr || stdout}`);
  }

  return extractResult(stdout, stderr);
}

export interface SafetyCheckParams {
  content: string;
  type?: 'text' | 'image' | 'auto';
}

export async function safetyCheck(params: SafetyCheckParams): Promise<Record<string, unknown>> {
  const scriptPath = path.join(AI_DIR, 'pipelines', 'safety-filter.js');
  const typeFlag = params.type === 'text' ? '--text' : params.type === 'image' ? '--image' : '';
  const args = typeFlag ? [params.content, typeFlag] : [params.content];

  const { stdout, stderr, exitCode: _exitCode } = await runPipeline(scriptPath, args);

  // Safety check returns non-zero if content is unsafe, but that's expected
  return extractResult(stdout, stderr);
}

export interface AutoEditParams {
  filePath: string;
  targetDuration: number;
}

export async function autoEdit(params: AutoEditParams): Promise<Record<string, unknown>> {
  const scriptPath = path.join(AI_DIR, 'pipelines', 'auto-edit.js');
  const { stdout, stderr, exitCode } = await runPipeline(scriptPath, [
    params.filePath,
    String(params.targetDuration),
  ]);

  if (exitCode !== 0) {
    throw new Error(`Auto-edit pipeline failed: ${stderr || stdout}`);
  }

  return extractResult(stdout, stderr);
}

export default {
  generateScene,
  generateReel,
  generateMusicVideo,
  generateDigitalTwin,
  autoEnhance,
  watermark,
  safetyCheck,
  autoEdit,
};
