#!/usr/bin/env node
/**
 * File Helpers — path management, directory creation, file I/O
 */
import fs from 'fs/promises';
import path from 'path';
import { getEnv } from './config.js';
import { log } from './logger.js';

const OUTPUT_DIR = getEnv('OUTPUT_DIR', './outputs');
const TEMP_DIR = getEnv('TEMP_DIR', './temp');

/**
 * Ensure directory exists (creates recursively)
 */
export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Get output path for a given pipeline type
 * @param {string} pipeline - e.g. 'scenes', 'reels', 'music-videos'
 * @param {string} filename - output filename
 */
export function getOutputPath(pipeline, filename) {
  return path.resolve(OUTPUT_DIR, pipeline, filename);
}

/**
 * Get temp file path
 * @param {string} filename
 */
export function getTempPath(filename) {
  return path.resolve(TEMP_DIR, filename);
}

/**
 * Write JSON to file
 */
export async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  log('info', `JSON written: ${filePath}`);
}

/**
 * Read JSON from file
 */
export async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Write binary buffer to file
 */
export async function writeBuffer(filePath, buffer) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, Buffer.from(buffer));
  log('info', `Buffer written: ${filePath}`);
}

/**
 * Check if file exists
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean up temp files
 */
export async function cleanupTemp(pattern) {
  try {
    const files = await fs.readdir(TEMP_DIR);
    const toDelete = pattern
      ? files.filter(f => f.includes(pattern))
      : files;
    for (const f of toDelete) {
      await fs.unlink(path.join(TEMP_DIR, f));
    }
    log('info', `Cleaned up ${toDelete.length} temp file(s)`);
  } catch {
    // temp dir may not exist
  }
}

/**
 * Generate a unique filename with timestamp
 */
export function generateFilename(prefix, ext) {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${ts}_${rand}.${ext}`;
}
