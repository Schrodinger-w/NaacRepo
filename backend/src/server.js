// Entry point. Connect to MongoDB and create the upload folder before listening, so the API
// never accepts a request it cannot serve.
import fs from 'node:fs';
import { env } from './config/env.js';
import { EVIDENCE_DIR } from './config/paths.js';
import { connectDatabase } from './config/db.js';
import { createApp } from './app.js';

// Keeps credentials out of the terminal if the connection string ever carries any.
function hideCredentials(uri) {
  return uri.replace(/\/\/[^@/]+@/, '//****@');
}

async function start() {
  try {
    await connectDatabase(env.MONGODB_URI);
  } catch (err) {
    console.error(`\nCould not connect to MongoDB at ${hideCredentials(env.MONGODB_URI)}`);
    console.error('Is the MongoDB Windows service running? Check in PowerShell with:  Get-Service MongoDB');
    console.error(`Details: ${err.message}\n`);
    process.exit(1);
  }

  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  const app = createApp();
  const server = app.listen(env.PORT, env.HOST, () => {
    console.log(`API ready at http://${env.HOST}:${env.PORT}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\nPort ${env.PORT} is already in use. Is the backend already running in another terminal?\n`);
    } else {
      console.error(err);
    }
    process.exit(1);
  });
}

start();
