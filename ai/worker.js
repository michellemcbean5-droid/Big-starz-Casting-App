/**
 * AI Worker — Redis Job Processor
 *
 * Polls Redis for AI generation jobs and executes pipeline scripts.
 * Supports: scene, reel, music-video, digital-twin, watermark, safety-check, auto-enhance, auto-edit
 */

import { createClient } from 'redis';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const JOB_QUEUE = 'ai:jobs:pending';
const JOB_PROGRESS = 'ai:jobs:progress';
const JOB_RESULTS = 'ai:jobs:results';
const WORKER_ID = `worker-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const PIPELINE_SCRIPTS = {
  'scene': 'pipelines/scene-generator.js',
  'reel': 'pipelines/reel-generator.js',
  'music-video': 'pipelines/music-video.js',
  'digital-twin': 'pipelines/digital-twin.js',
  'watermark': 'pipelines/watermark.js',
  'safety-check': 'pipelines/safety-filter.js',
  'auto-enhance': 'pipelines/auto-enhance.js',
  'auto-edit': 'pipelines/auto-edit.js',
};

let client;
let isShuttingDown = false;

/**
 * Connect to Redis
 */
async function connectRedis() {
  client = createClient({ url: REDIS_URL });

  client.on('error', (err) => {
    console.error('Redis client error:', err);
  });

  client.on('connect', () => {
    console.log(`[${WORKER_ID}] Connected to Redis`);
  });

  await client.connect();
}

/**
 * Execute a pipeline script for a given job
 */
async function processJob(job) {
  const { id, type, payload } = job;

  const scriptPath = PIPELINE_SCRIPTS[type];
  if (!scriptPath) {
    throw new Error(`Unknown job type: ${type}`);
  }

  console.log(`[${WORKER_ID}] Processing job ${id} (type: ${type})`);

  // Update progress
  await client.hSet(JOB_PROGRESS, id, JSON.stringify({
    status: 'running',
    workerId: WORKER_ID,
    startedAt: new Date().toISOString(),
  }));

  const fullPath = join(__dirname, scriptPath);

  return new Promise((resolve, reject) => {
    const args = [fullPath];
    if (payload && typeof payload === 'object') {
      args.push(JSON.stringify(payload));
    }

    const child = spawn('node', args, {
      env: { ...process.env, AI_JOB_ID: id },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', async (code) => {
      if (code === 0) {
        let result;
        try {
          result = JSON.parse(stdout);
        } catch {
          result = { output: stdout.trim() };
        }

        await client.hSet(JOB_RESULTS, id, JSON.stringify({
          status: 'completed',
          workerId: WORKER_ID,
          result,
          completedAt: new Date().toISOString(),
        }));

        await client.hDel(JOB_PROGRESS, id);
        console.log(`[${WORKER_ID}] Job ${id} completed successfully`);
        resolve(result);
      } else {
        const error = {
          status: 'failed',
          workerId: WORKER_ID,
          error: stderr || `Process exited with code ${code}`,
          failedAt: new Date().toISOString(),
        };

        await client.hSet(JOB_RESULTS, id, JSON.stringify(error));
        await client.hDel(JOB_PROGRESS, id);
        console.error(`[${WORKER_ID}] Job ${id} failed: ${stderr || `exit code ${code}`}`);
        reject(new Error(error.error));
      }
    });

    // Pass payload as stdin if available
    if (payload && typeof payload === 'object') {
      child.stdin.write(JSON.stringify(payload));
      child.stdin.end();
    }
  });
}

/**
 * Main worker loop — pop jobs from Redis queue
 */
async function startWorker() {
  console.log(`[${WORKER_ID}] AI Worker starting...`);
  console.log(`[${WORKER_ID}] Supported pipelines: ${Object.keys(PIPELINE_SCRIPTS).join(', ')}`);

  await connectRedis();

  while (!isShuttingDown) {
    try {
      // Blocking pop from Redis queue (wait up to 5 seconds)
      const result = await client.blPop(JOB_QUEUE, 5);

      if (result) {
        const job = JSON.parse(result.element);
        await processJob(job);
      }
    } catch (err) {
      console.error(`[${WORKER_ID}] Error processing job:`, err.message);

      // Backoff on repeated errors
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log(`[${WORKER_ID}] Worker shutting down gracefully...`);
  await client.quit();
  process.exit(0);
}

/**
 * Graceful shutdown
 */
function shutdown() {
  console.log(`[${WORKER_ID}] Received shutdown signal`);
  isShuttingDown = true;

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error(`[${WORKER_ID}] Forced shutdown after timeout`);
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (err) => {
  console.error(`[${WORKER_ID}] Uncaught exception:`, err);
  shutdown();
});

startWorker().catch((err) => {
  console.error(`[${WORKER_ID}] Fatal startup error:`, err);
  process.exit(1);
});
