/**
 * migrate_aiml_department.ts
 *
 * One-shot migration: moves the AM programme (Artificial Intelligence and
 * Machine Learning) from department 'Computer Science and Engineering' to the
 * new standalone department 'Artificial Intelligence and Machine Learning'.
 *
 * Run after updating shared/src/constants.ts and rebuilding, then sync:
 *   npx ts-node server/src/scripts/migrate_aiml_department.ts
 *   OR (compiled):
 *   node server/dist/scripts/migrate_aiml_department.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../server/.env') });

const OLD_DEPT = 'Computer Science and Engineering';
const NEW_DEPT = 'Artificial Intelligence and Machine Learning';
const PROG_CODE = 'AM';

async function migrate() {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/syllabusforge';

  console.log('Connecting to MongoDB at:', uri);
  await mongoose.connect(uri);
  console.log('Connected.');

  const db = mongoose.connection.db;
  if (!db) throw new Error('No DB connection');

  // 1. Update the Programme collection
  const progResult = await db.collection('programmes').updateMany(
    { code: PROG_CODE, department: OLD_DEPT },
    { $set: { department: NEW_DEPT, updatedAt: new Date() } }
  );
  console.log(
    `programmes: matched=${progResult.matchedCount}, modified=${progResult.modifiedCount}`
  );

  // 2. Update the programmecodes (MasterData) collection if present
  try {
    const mcResult = await db.collection('programmecodes').updateMany(
      { code: PROG_CODE, department: OLD_DEPT },
      { $set: { department: NEW_DEPT, updatedAt: new Date() } }
    );
    console.log(
      `programmecodes: matched=${mcResult.matchedCount}, modified=${mcResult.modifiedCount}`
    );
  } catch {
    console.log('programmecodes collection not found — skipping.');
  }

  // 3. Update any Course documents whose department field still says CS for AM
  const courseResult = await db.collection('courses').updateMany(
    { programmeCode: PROG_CODE, department: OLD_DEPT },
    { $set: { department: NEW_DEPT, updatedAt: new Date() } }
  );
  console.log(
    `courses: matched=${courseResult.matchedCount}, modified=${courseResult.modifiedCount}`
  );

  // 4. Update any User documents in the old CSE department whose
  //    programmeAccess contains only AM (or is an AIML-only user)
  const userResult = await db.collection('users').updateMany(
    {
      department: OLD_DEPT,
      programmeAccess: { $in: [PROG_CODE] },
      // Only migrate users whose sole programmeAccess is AM
      $where: 'this.programmeAccess.length === 1 && this.programmeAccess[0] === "AM"',
    },
    { $set: { department: NEW_DEPT, updatedAt: new Date() } }
  );
  console.log(
    `users (AM-only): matched=${userResult.matchedCount}, modified=${userResult.modifiedCount}`
  );

  console.log('\nMigration complete. Run syncProgrammes next to reconcile the Programme collection.');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});

