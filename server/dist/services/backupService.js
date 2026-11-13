import fs from 'fs';
import path from 'path';
import { Course } from '../models/Course.js';
import { Programme } from '../models/Programme.js';
import { User } from '../models/User.js';
import { ProgrammeCodeModel, CategoryCodeModel, TpsVerbModel, LabObjectiveModel, GeneralCoPoolModel, PerformanceIndicatorModel, SdgListModel, DomainToSdgMapModel, TcpWeightageTableModel, ConfigSettingsModel, } from '../models/MasterData.js';
export function getLocalDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
export function getBackupBaseDir() {
    // Support running from repo root or server package directory
    const cwd = process.cwd();
    const base = cwd.endsWith('server') ? path.resolve(cwd, '..', 'backups') : path.resolve(cwd, 'backups');
    if (!fs.existsSync(base)) {
        fs.mkdirSync(base, { recursive: true });
    }
    return base;
}
export async function fetchFullDataset() {
    const [courses, programmes, users, programmeCodes, categoryCodes, verbs, objectives, generalCos, pis, sdgs, domainSdgMap, tcpWeightage, config,] = await Promise.all([
        Course.find({}).lean(),
        Programme.find({}).lean(),
        User.find({}, '-password').lean(),
        ProgrammeCodeModel.find({}).lean(),
        CategoryCodeModel.find({}).lean(),
        TpsVerbModel.find({}).lean(),
        LabObjectiveModel.find({}).lean(),
        GeneralCoPoolModel.find({}).lean(),
        PerformanceIndicatorModel.find({}).lean(),
        SdgListModel.find({}).lean(),
        DomainToSdgMapModel.find({}).lean(),
        TcpWeightageTableModel.find({}).lean(),
        ConfigSettingsModel.find({}).lean(),
    ]);
    const masterData = {
        programmeCodes,
        categoryCodes,
        verbs,
        objectives,
        generalCos,
        pis,
        sdgs,
        domainSdgMap,
        tcpWeightage,
        config,
    };
    return {
        courses,
        programmes,
        users,
        masterData,
    };
}
export async function createDailyBackup(customDate) {
    const baseDir = getBackupBaseDir();
    const dateStr = customDate || getLocalDateString();
    const targetFolder = path.join(baseDir, dateStr);
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
    }
    const data = await fetchFullDataset();
    const metadata = {
        backupId: `tce_bos_backup_${dateStr}`,
        backupDate: dateStr,
        createdAt: new Date().toISOString(),
        institution: 'Thiagarajar College of Engineering, Madurai (Autonomous)',
        version: '1.0.0',
        counts: {
            courses: data.courses.length,
            programmes: data.programmes.length,
            users: data.users.length,
            masterData: {
                programmeCodes: data.masterData.programmeCodes.length,
                categoryCodes: data.masterData.categoryCodes.length,
                verbs: data.masterData.verbs.length,
                objectives: data.masterData.objectives.length,
                generalCos: data.masterData.generalCos.length,
                pis: data.masterData.pis.length,
                sdgs: data.masterData.sdgs.length,
                domainSdgMap: data.masterData.domainSdgMap.length,
                tcpWeightage: data.masterData.tcpWeightage.length,
                config: data.masterData.config.length,
            },
        },
        files: [
            'courses.json',
            'programmes.json',
            'users.json',
            'masterdata.json',
            'tce_bos_full_backup.json',
            'metadata.json',
        ],
    };
    const consolidatedPayload = {
        _backupMetadata: metadata,
        ...data,
    };
    const fullBackupJson = JSON.stringify(consolidatedPayload, null, 2);
    // Write individual collection JSON files
    fs.writeFileSync(path.join(targetFolder, 'courses.json'), JSON.stringify(data.courses, null, 2), 'utf8');
    fs.writeFileSync(path.join(targetFolder, 'programmes.json'), JSON.stringify(data.programmes, null, 2), 'utf8');
    fs.writeFileSync(path.join(targetFolder, 'users.json'), JSON.stringify(data.users, null, 2), 'utf8');
    fs.writeFileSync(path.join(targetFolder, 'masterdata.json'), JSON.stringify(data.masterData, null, 2), 'utf8');
    fs.writeFileSync(path.join(targetFolder, 'tce_bos_full_backup.json'), fullBackupJson, 'utf8');
    fs.writeFileSync(path.join(targetFolder, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');
    // Calculate folder size
    let totalBytes = 0;
    for (const file of metadata.files) {
        const fPath = path.join(targetFolder, file);
        if (fs.existsSync(fPath)) {
            totalBytes += fs.statSync(fPath).size;
        }
    }
    metadata.totalSizeBytes = totalBytes;
    fs.writeFileSync(path.join(targetFolder, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');
    return {
        folder: targetFolder,
        metadata,
        fullBackupJson,
    };
}
export function listExistingBackups() {
    const baseDir = getBackupBaseDir();
    if (!fs.existsSync(baseDir))
        return [];
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    const backups = entries
        .filter(e => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
        .map(e => {
        const folderPath = path.join(baseDir, e.name);
        const metaPath = path.join(folderPath, 'metadata.json');
        let metadata;
        let sizeBytes = 0;
        try {
            if (fs.existsSync(metaPath)) {
                metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            }
            const files = fs.readdirSync(folderPath);
            for (const f of files) {
                sizeBytes += fs.statSync(path.join(folderPath, f)).size;
            }
        }
        catch (err) {
            console.warn(`Error reading backup folder ${e.name}`, err);
        }
        return {
            date: e.name,
            folderPath,
            metadata,
            sizeBytes,
        };
    })
        .sort((a, b) => b.date.localeCompare(a.date));
    return backups;
}
