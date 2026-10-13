import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PROGRAMME_CODES } from '@syllabusforge/shared';
import { Programme } from '../models/Programme.js';
import { ProgrammeCodeModel } from '../models/MasterData.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../server/.env') });
async function sync() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/syllabusforge';
    console.log('Connecting to MongoDB at:', uri);
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');
    for (const p of PROGRAMME_CODES) {
        await Programme.findOneAndUpdate({ code: p.code }, { name: p.name, department: p.department, active: true }, { upsert: true, new: true });
        await ProgrammeCodeModel.findOneAndUpdate({ code: p.code }, { name: p.name, department: p.department }, { upsert: true, new: true });
    }
    console.log(`Successfully synced ${PROGRAMME_CODES.length} programmes in MongoDB!`);
    await mongoose.disconnect();
}
sync().catch(err => {
    console.log('Sync note (Mongo might be optional/offline):', err.message);
    process.exit(0);
});
