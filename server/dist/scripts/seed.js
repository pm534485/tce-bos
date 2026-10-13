import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Programme } from '../models/Programme.js';
import { Course } from '../models/Course.js';
import { ProgrammeCodeModel, CategoryCodeModel, TpsVerbModel, LabObjectiveModel, GeneralCoPoolModel, PerformanceIndicatorModel, SdgListModel, DomainToSdgMapModel, TcpWeightageTableModel, ConfigSettingsModel, } from '../models/MasterData.js';
import { PROGRAMME_CODES, CATEGORY_CODES, TPS_VERBS, LAB_OBJECTIVES, GENERAL_CO_POOL, PERFORMANCE_INDICATORS, SDG_LIST, DOMAIN_TO_SDG_MAP, TCP_WEIGHTAGE_TABLE, DEFAULT_CONFIG_SETTINGS, } from '@syllabusforge/shared';
import { SEED_USERS, DEMO_THEORY_COURSE, DEMO_PRACTICAL_COURSE, DEMO_TCP_COURSE, DEMO_ECE_CIRCUITS_COURSE, } from '../services/seedData.js';
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/syllabusforge';
export async function seedDatabase() {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');
    // 1. Clear existing collections
    console.log('Clearing old collections...');
    await Promise.all([
        User.deleteMany({}),
        Programme.deleteMany({}),
        Course.deleteMany({}),
        ProgrammeCodeModel.deleteMany({}),
        CategoryCodeModel.deleteMany({}),
        TpsVerbModel.deleteMany({}),
        LabObjectiveModel.deleteMany({}),
        GeneralCoPoolModel.deleteMany({}),
        PerformanceIndicatorModel.deleteMany({}),
        SdgListModel.deleteMany({}),
        DomainToSdgMapModel.deleteMany({}),
        TcpWeightageTableModel.deleteMany({}),
        ConfigSettingsModel.deleteMany({}),
    ]);
    // 2. Seed Master Data
    console.log('Seeding Master Data...');
    await ProgrammeCodeModel.insertMany(PROGRAMME_CODES);
    await CategoryCodeModel.insertMany(CATEGORY_CODES);
    const verbDocs = Object.entries(TPS_VERBS).map(([level, verbs]) => ({
        tpsLevel: Number(level),
        verbs,
    }));
    await TpsVerbModel.insertMany(verbDocs);
    await LabObjectiveModel.insertMany(LAB_OBJECTIVES);
    await GeneralCoPoolModel.insertMany(GENERAL_CO_POOL);
    await PerformanceIndicatorModel.insertMany(PERFORMANCE_INDICATORS);
    await SdgListModel.insertMany(SDG_LIST);
    await DomainToSdgMapModel.insertMany(DOMAIN_TO_SDG_MAP);
    await TcpWeightageTableModel.insertMany(TCP_WEIGHTAGE_TABLE);
    // Config settings
    const configDocs = Object.entries(DEFAULT_CONFIG_SETTINGS).map(([key, value]) => ({
        key,
        value,
        description: `System configuration for ${key}`,
    }));
    await ConfigSettingsModel.insertMany(configDocs);
    // 3. Seed Programmes
    console.log('Seeding Programmes...');
    const programmeDocs = PROGRAMME_CODES.map(p => ({
        code: p.code,
        name: p.name,
        department: p.department,
        active: true,
    }));
    await Programme.insertMany(programmeDocs);
    // 4. Seed Users
    console.log('Seeding Users...');
    for (const u of SEED_USERS) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(u.password, salt);
        await User.create({
            name: u.name,
            email: u.email.toLowerCase(),
            passwordHash,
            role: u.role,
            department: u.department,
            designation: u.designation,
            programmeAccess: u.programmeAccess,
        });
    }
    // 5. Seed 3 Compliant Demo Courses
    console.log('Seeding Demo Courses...');
    await Course.create(DEMO_THEORY_COURSE);
    await Course.create(DEMO_PRACTICAL_COURSE);
    await Course.create(DEMO_TCP_COURSE);
    await Course.create(DEMO_ECE_CIRCUITS_COURSE);
    console.log('Database seeded successfully with institutional master data and 4 demo courses (including 26ECCA0)!');
}
if (process.argv[1]?.includes('seed.ts')) {
    seedDatabase()
        .then(() => {
        console.log('Seed completed successfully. Exiting.');
        process.exit(0);
    })
        .catch(err => {
        console.error('Seed error:', err);
        process.exit(1);
    });
}
