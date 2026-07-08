#!/usr/bin/env node
/**
 * Logger — structured logging utility
 */
import { getEnv } from './config.js';

const LOG_LEVEL = getEnv('LOG_LEVEL', 'info');

const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level) {
  return LEVELS[level] >= LEVELS[LOG_LEVEL] || LEVELS[LOG_LEVEL] === undefined;
}

function timestamp() {
  return new Date().toISOString();
}

export function log(level, message, meta = {}) {
  if (!shouldLog(level)) return;

  const entry = {
    time: timestamp(),
    level: level.toUpperCase(),
    message,
    ...meta,
  };

  const output = JSON.stringify(entry);

  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export function debug(message, meta) { log('debug', message, meta); }
export function info(message, meta) { log('info', message, meta); }
export function warn(message, meta) { log('warn', message, meta); }
export function error(message, meta) { log('error', message, meta); }
