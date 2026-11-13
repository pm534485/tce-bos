import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import {
  createDailyBackup,
  fetchFullDataset,
  listExistingBackups,
  getBackupBaseDir,
  getLocalDateString,
} from '../services/backupService.js';

const router = Router();

// GET /api/backup/download - Direct one-click download of the latest full JSON backup
router.get('/download', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const todayStr = getLocalDateString();
    const data = await fetchFullDataset();

    const payload = {
      _backupMetadata: {
        exportDate: todayStr,
        timestamp: new Date().toISOString(),
        exportedBy: req.user?.email || 'Admin',
        institution: 'Thiagarajar College of Engineering, Madurai (Autonomous)',
        version: '1.0.0',
        counts: {
          courses: data.courses.length,
          programmes: data.programmes.length,
          users: data.users.length,
        },
      },
      ...data,
    };

    const fileName = `tce_bos_backup_${todayStr}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.status(200).send(JSON.stringify(payload, null, 2));
  } catch (error: any) {
    console.error('Error generating backup download:', error);
    res.status(500).json({ error: error.message || 'Failed to generate backup JSON' });
  }
});

// POST /api/backup/trigger - Trigger immediate daily backup on disk
router.post('/trigger', authenticate, requireRole(['ADMIN', 'BOS_COORDINATOR']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await createDailyBackup();
    res.json({
      success: true,
      message: `Daily backup successfully saved to ${result.folder}`,
      metadata: result.metadata,
      folder: result.folder,
    });
  } catch (error: any) {
    console.error('Error triggering daily backup:', error);
    res.status(500).json({ error: error.message || 'Failed to perform daily backup' });
  }
});

// GET /api/backup/list - List all existing daily backups stored on disk
router.get('/list', authenticate, requireRole(['ADMIN', 'BOS_COORDINATOR']), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const backups = listExistingBackups();
    res.json({
      success: true,
      backups,
      baseDir: getBackupBaseDir(),
    });
  } catch (error: any) {
    console.error('Error listing backups:', error);
    res.status(500).json({ error: error.message || 'Failed to list backups' });
  }
});

// GET /api/backup/download-dated/:date - Download backup from a specific date folder
router.get('/download-dated/:date', authenticate, requireRole(['ADMIN', 'BOS_COORDINATOR']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dateParam = String(req.params.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD.' });
      return;
    }

    const baseDir = getBackupBaseDir();
    const filePath = path.join(baseDir, dateParam, 'tce_bos_full_backup.json');

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: `Backup for ${dateParam} not found.` });
      return;
    }

    const fileName = `tce_bos_backup_${dateParam}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error(`Error downloading backup for ${req.params.date}:`, error);
    res.status(500).json({ error: error.message || 'Failed to download dated backup' });
  }
});

export default router;
