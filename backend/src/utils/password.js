// Only the hash is ever stored, never the password itself.
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

// Cost factor: every +1 doubles the work per guess. 12 keeps one check to a few hundred
// milliseconds, which is unnoticeable at sign-in but very slow for someone guessing.
const BCRYPT_ROUNDS = 12;

export function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

export function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

// FR-002: an unknown email is still compared against this hash of a random value, so a
// failed sign-in takes the same time either way and timing cannot reveal which emails exist.
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), BCRYPT_ROUNDS);
