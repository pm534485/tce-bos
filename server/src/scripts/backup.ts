import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { createDailyBackup } from '../services/backupService.js';

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

async function runBackup() {
  console.log('----------------------------------------------------');
  console.log('   TCE Board of Studies - Daily JSON Backup Tool    ');
  console.log('----------------------------------------------------');
  console.log(`[1/3] Connecting to MongoDB (${MONGO_URI.includes('@') ? 'Cloud Atlas' : 'Local'})...`);

  try {
    await mongoose.connect(MONGO_URI, getConnectOptions(MONGO_URI));
    console.log(`[2/3] Connected to database: ${mongoose.connection.name}`);

    console.log('[3/3] Exporting collections to date-stamped folder...');
    const result = await createDailyBackup();

    console.log('\n====================================================');
    console.log('             BACKUP COMPLETED SUCCESSFULLY          ');
    console.log('====================================================');
    console.log(`Backup Date   : ${result.metadata.backupDate}`);
    console.log(`Destination   : ${result.folder}`);
    console.log(`Total Courses : ${result.metadata.counts.courses}`);
    console.log(`Programmes    : ${result.metadata.counts.programmes}`);
    console.log(`Users         : ${result.metadata.counts.users}`);
    console.log(`Total Size    : ${((result.metadata.totalSizeBytes || 0) / 1024).toFixed(2)} KB`);
    console.log('Files Created :');
    result.metadata.files.forEach(f => console.log(`  - ${f}`));
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('\n[ERROR] Backup failed:', error.message || error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
}

runBackup();

