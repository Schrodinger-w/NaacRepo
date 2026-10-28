// Fills the database with demo data: 4 departments, the 7 NAAC criteria, demo sub-metrics
// and one account per role (password Demo@123).
//   npm run seed         works only on an empty database, so it can never wipe real work
//   npm run seed:reset   DELETES all data and uploaded files first, then seeds again
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { EVIDENCE_DIR } from '../config/paths.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { hashPassword } from '../utils/password.js';
import { ALL_MODELS, Department, User, Criterion, SubMetric } from '../models/index.js';
import { DEMO_PASSWORD, departments, criteria, subMetrics, users } from './seedData.js';

const resetRequested = process.argv.includes('--reset');

// Plain files directly inside storage/evidence only, so a stray sub-folder is left alone.
function emptyEvidenceFolder() {
  if (!fs.existsSync(EVIDENCE_DIR)) return 0;
  let removed = 0;
  for (const name of fs.readdirSync(EVIDENCE_DIR)) {
    const filePath = path.join(EVIDENCE_DIR, name);
    if (fs.statSync(filePath).isFile()) {
      fs.rmSync(filePath);
      removed += 1;
    }
  }
  return removed;
}

async function seed() {
  await connectDatabase(env.MONGODB_URI);

  if (resetRequested) {
    await mongoose.connection.dropDatabase();
    const removedFiles = emptyEvidenceFolder();
    console.log(`Reset: all data deleted (everyone is signed out) and ${removedFiles} uploaded file(s) removed.`);
  } else if ((await User.countDocuments()) > 0 || (await Department.countDocuments()) > 0) {
    console.log('\nThe database already has data, so nothing was changed.');
    console.log('To delete everything (including uploaded files) and seed again, run:  npm run seed:reset\n');
    return;
  }

  // dropDatabase() also drops the indexes, so unique constraints have to be rebuilt.
  await Promise.all(ALL_MODELS.map((model) => model.createIndexes()));

  const departmentDocs = await Department.insertMany(departments);
  const departmentIdByCode = Object.fromEntries(departmentDocs.map((d) => [d.code, d._id]));

  const criterionDocs = await Criterion.insertMany(criteria);
  const criterionIdByNumber = Object.fromEntries(criterionDocs.map((c) => [c.number, c._id]));

  await SubMetric.insertMany(
    subMetrics.map((s) => ({ code: s.code, name: s.name, criterion: criterionIdByNumber[s.criterion] })),
  );

  // bcrypt salts each hash, so the shared demo password still produces four different hashes.
  for (const u of users) {
    await User.create({
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      department: u.department ? departmentIdByCode[u.department] : undefined,
      passwordHash: await hashPassword(DEMO_PASSWORD),
    });
  }

  console.log('\nSeed complete.');
  console.log(`  Departments: ${departments.length}  (${departments.map((d) => d.code).join(', ')})`);
  console.log(`  Criteria:    ${criteria.length}`);
  console.log(`  Sub-metrics: ${subMetrics.length}  (demo values, not the official NAAC list)`);
  console.log(`\n  Demo accounts (password for all: ${DEMO_PASSWORD})`);
  for (const u of users) {
    console.log(`    ${u.role.padEnd(12)} ${u.name.padEnd(23)} ${u.email.padEnd(29)} ${u.department || '-'}`);
  }
  console.log('');
}

seed()
  .catch((err) => {
    console.error('\nSeeding failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
