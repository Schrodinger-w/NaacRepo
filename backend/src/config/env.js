// Every setting in one checked object. A missing or placeholder value stops the server
// at startup instead of failing later at runtime.
import path from 'node:path';
import dotenv from 'dotenv';
import { BACKEND_ROOT } from './paths.js';

dotenv.config({ path: path.join(BACKEND_ROOT, '.env') });

function stopWithConfigError(message) {
  console.error(`\nConfiguration error: ${message}`);
  console.error('Fix backend/.env (compare it with backend/.env.example) and start again.\n');
  process.exit(1);
}

function readRequired(name) {
  const value = process.env[name];
  if (!value) stopWithConfigError(`${name} is missing.`);
  return value;
}

const sessionSecret = readRequired('SESSION_SECRET');
if (sessionSecret.startsWith('replace-with') || sessionSecret.length < 32) {
  stopWithConfigError('SESSION_SECRET must be a random string of at least 32 characters.');
}

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  HOST: process.env.HOST || '127.0.0.1',
  MONGODB_URI: readRequired('MONGODB_URI'),
  SESSION_SECRET: sessionSecret,
  SESSION_IDLE_MINUTES: Number(process.env.SESSION_IDLE_MINUTES) || 30,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
});
