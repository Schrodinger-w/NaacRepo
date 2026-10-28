// The single Mongoose connection shared by the whole backend.
import mongoose from 'mongoose';

function onDisconnected() {
  console.warn('MongoDB disconnected. Waiting for it to come back...');
}
function onReconnected() {
  console.log('MongoDB reconnected.');
}

export async function connectDatabase(uri) {
  // 5s instead of the default 30s, so a stopped MongoDB service is noticed quickly.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected (database: ${mongoose.connection.name})`);

  // Mongoose reconnects by itself after the first connection succeeds; these listeners
  // only make that visible. Registering them here rather than at module level keeps a
  // failed first attempt from printing a misleading "waiting for it to come back".
  mongoose.connection.on('disconnected', onDisconnected);
  mongoose.connection.on('reconnected', onReconnected);
}

// For scripts that close the connection on purpose (the seed): a deliberate disconnect
// is not worth warning about.
export async function disconnectDatabase() {
  mongoose.connection.off('disconnected', onDisconnected);
  mongoose.connection.off('reconnected', onReconnected);
  await mongoose.disconnect();
}

export function isDatabaseConnected() {
  // readyState: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting.
  return mongoose.connection.readyState === 1;
}
