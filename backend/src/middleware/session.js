// Session login with express-session, stored in MongoDB via connect-mongo. The browser holds
// only a random session id; who is signed in lives on the server, so signing out really ends
// the session there (FR-003).
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

export const SESSION_COOKIE_NAME = 'naac_sid';

// Must be called after MongoDB is connected; server.js guarantees the order.
export function createSessionMiddleware() {
  const idleMilliseconds = env.SESSION_IDLE_MINUTES * 60 * 1000;

  return session({
    name: SESSION_COOKIE_NAME,
    secret: env.SESSION_SECRET, // signs the cookie so a forged id is rejected
    resave: false,
    saveUninitialized: false, // no session for visitors who never sign in
    // FR-007: every request pushes the expiry forward, making this an inactivity timeout
    // rather than a fixed lifetime.
    rolling: true,
    cookie: {
      httpOnly: true, // page scripts cannot read the session id
      sameSite: 'lax', // not sent with requests originating from other sites
      secure: env.NODE_ENV === 'production', // plain http is needed on localhost
      maxAge: idleMilliseconds,
    },
    store: MongoStore.create({
      client: mongoose.connection.getClient(), // reuse the app's connection rather than opening another
      collectionName: 'sessions',
      // connect-mongo adds a TTL index, so MongoDB expires sessions without any code from us.
    }),
  });
}
