import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Course } from '../models/Course.js';
import { Programme } from '../models/Programme.js';
import { User } from '../models/User.js';
import {
  ProgrammeCodeModel,
  CategoryCodeModel,
  TpsVerbModel,
  LabObjectiveModel,
  GeneralCoPoolModel,
  PerformanceIndicatorModel,
  SdgListModel,
  DomainToSdgMapModel,
  TcpWeightageTableModel,
  ConfigSettingsModel,
} from '../models/MasterData.js';
import { getBackupBaseDir } from '../services/backupService.js';

dotenv.config();

const ATLAS_FALLBACK_URI = 'mongodb+srv://admin:password_123@anomaly-cluster.zvatocr.mongodb.net/syllabusforge?authSource=admin&appName=anomaly-cluster';
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || (process.env.VERCEL ? ATLAS_FALLBACK_URI : 'mongodb://localhost:27017/syllabusforge');

function getConnectOptions(uri: string): mongoose.ConnectOptions {
  const withoutProto = uri.split('://')[1] || '';
  const pathPart = withoutProto.split('?')[0];
  const slashIdx = pathPart.indexOf('/');
  const db = slashIdx !== -1 ? pathPart.substring(slashIdx + 1) : '';
  return {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    ...(db ? {} : { dbName: 'syllabusforge' }),
  };
}

async function runRestore() {
  const args = process.argv.slice(2);
  const baseDir = getBackupBaseDir();

  // If no date argument given, pick the latest backup folder
  let targetDate = args[0];
  if (!targetDate) {
    const folders = fs.readdirSync(baseDir).filter(f => /^\d{4}-\d{2}-\d{2}$/.test(f)).sort();
    if (folders.length === 0) {
      console.error('[ERROR] No backup folders found in', baseDir);
      process.exit(1);
    }
    targetDate = folders[folders.length - 1];
    console.log(`[INFO] No date specified. Automatically selecting most recent backup: ${targetDate}`);
  }

  const backupFile = path.join(baseDir, targetDate, 'tce_bos_full_backup.json');
  if (!fs.existsSync(backupFile)) {
    console.error(`[ERROR] Backup file not found at: ${backupFile}`);
    process.exit(1);
  }

  console.log('----------------------------------------------------');
  console.log(`   Restoring Database from Backup: ${targetDate}    `);
  console.log('----------------------------------------------------');

  try {
    const raw = fs.readFileSync(backupFile, 'utf8');
    const backupData = JSON.parse(raw);

    console.log(`Connecting to MongoDB at ${MONGO_URI.includes('@') ? 'Cloud Atlas' : 'Local'}...`);
    await mongoose.connect(MONGO_URI, getConnectOptions(MONGO_URI));
    console.log(`Connected to database: ${mongoose.connection.name}`);

    // Restore Courses
    if (Array.isArray(backupData.courses) && backupData.courses.length > 0) {
      console.log(`Restoring ${backupData.courses.length} courses...`);
      for (const c of backupData.courses) {
        const { _id, ...doc } = c;
        await Course.findOneAndUpdate({ courseCode: c.courseCode }, doc, { upsert: true, setDefaultsOnInsert: true });
      }
    }

    // Restore Programmes
    if (Array.isArray(backupData.programmes) && backupData.programmes.length > 0) {
      console.log(`Restoring ${backupData.programmes.length} programmes...`);
      for (const p of backupData.programmes) {
        const { _id, ...doc } = p;
        await Programme.findOneAndUpdate({ code: p.code }, doc, { upsert: true, setDefaultsOnInsert: true });
      }
    }

    // Restore Users
    if (Array.isArray(backupData.users) && backupData.users.length > 0) {
      console.log(`Restoring ${backupData.users.length} users...`);
      for (const u of backupData.users) {
        const { _id, ...doc } = u;
        await User.findOneAndUpdate({ email: u.email }, doc, { upsert: true, setDefaultsOnInsert: true });
      }
    }

    console.log('\n====================================================');
    console.log('            DATABASE RESTORED SUCCESSFULLY          ');
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('\n[ERROR] Restore failed:', error.message || error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
}

runRestore();
