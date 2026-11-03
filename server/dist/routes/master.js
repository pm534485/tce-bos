import { Router } from 'express';
import { ProgrammeCodeModel, CategoryCodeModel, TpsVerbModel, LabObjectiveModel, GeneralCoPoolModel, PerformanceIndicatorModel, SdgListModel, DomainToSdgMapModel, TcpWeightageTableModel, ConfigSettingsModel, } from '../models/MasterData.js';
import { authenticate, requireRole } from '../middleware/auth.js';
const router = Router();
const MODEL_MAP = {
    programmes: ProgrammeCodeModel,
    categories: CategoryCodeModel,
    verbs: TpsVerbModel,
    objectives: LabObjectiveModel,
    generalCos: GeneralCoPoolModel,
    pis: PerformanceIndicatorModel,
    sdgs: SdgListModel,
    domainSdgMap: DomainToSdgMapModel,
    tcpWeightage: TcpWeightageTableModel,
    config: ConfigSettingsModel,
};
// GET /api/master/regulation - Get active institutional regulation and history/list
router.get('/regulation', async (req, res) => {
    try {
        const yearDoc = await ConfigSettingsModel.findOne({ key: 'regulationYear' });
        const codeDoc = await ConfigSettingsModel.findOne({ key: 'regulationCode' });
        const listDoc = await ConfigSettingsModel.findOne({ key: 'regulationList' });
        const regulationYear = yearDoc?.value ? Number(yearDoc.value) : 2026;
        const regulationCode = codeDoc?.value ? String(codeDoc.value).trim() : '26';
        const regulationList = Array.isArray(listDoc?.value) && listDoc.value.length > 0
            ? listDoc.value
            : [
                { year: 2026, code: '26', label: 'Regulation 2026' },
                { year: 2022, code: '22', label: 'Regulation 2022' },
                { year: 2018, code: '18', label: 'Regulation 2018' },
            ];
        // Ensure the current active is present in the list
        if (!regulationList.some(r => Number(r.year) === regulationYear)) {
            regulationList.unshift({ year: regulationYear, code: regulationCode, label: `Regulation ${regulationYear}` });
        }
        res.json({ regulationYear, regulationCode, regulationList });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/master/regulation - Update active institutional regulation or add new regulation (Admin / Coordinator)
router.post('/regulation', authenticate, async (req, res) => {
    try {
        const { regulationYear, regulationCode, label } = req.body;
        if (!regulationYear || !regulationCode) {
            res.status(400).json({ error: 'Both regulationYear and regulationCode are required.' });
            return;
        }
        const yearNum = Number(regulationYear);
        const codeStr = String(regulationCode).trim();
        const labelStr = label ? String(label).trim() : `Regulation ${yearNum}`;
        await ConfigSettingsModel.findOneAndUpdate({ key: 'regulationYear' }, { key: 'regulationYear', value: yearNum, description: 'Active Regulation Year' }, { upsert: true, new: true });
        await ConfigSettingsModel.findOneAndUpdate({ key: 'regulationCode' }, { key: 'regulationCode', value: codeStr, description: 'Active Regulation Code' }, { upsert: true, new: true });
        // Update regulations catalog list
        const listDoc = await ConfigSettingsModel.findOne({ key: 'regulationList' });
        let existingList = Array.isArray(listDoc?.value)
            ? [...listDoc.value]
            : [
                { year: 2026, code: '26', label: 'Regulation 2026' },
                { year: 2022, code: '22', label: 'Regulation 2022' },
                { year: 2018, code: '18', label: 'Regulation 2018' },
            ];
        const idx = existingList.findIndex(r => Number(r.year) === yearNum);
        if (idx >= 0) {
            existingList[idx] = { year: yearNum, code: codeStr, label: labelStr };
        }
        else {
            existingList.unshift({ year: yearNum, code: codeStr, label: labelStr });
        }
        await ConfigSettingsModel.findOneAndUpdate({ key: 'regulationList' }, { key: 'regulationList', value: existingList, description: 'Institutional Regulations Catalog' }, { upsert: true, new: true });
        res.json({
            message: 'Active regulation updated successfully.',
            regulationYear: yearNum,
            regulationCode: codeStr,
            regulationList: existingList,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /api/master/:collection
router.get('/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const model = MODEL_MAP[collection];
        if (!model) {
            res.status(404).json({ error: `Master collection "${collection}" not found.` });
            return;
        }
        const data = await model.find().sort({ createdAt: 1, no: 1, code: 1, piNumber: 1 });
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/master/:collection (Admin only)
router.post('/:collection', authenticate, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { collection } = req.params;
        const model = MODEL_MAP[collection];
        if (!model) {
            res.status(404).json({ error: `Master collection "${collection}" not found.` });
            return;
        }
        const item = new model(req.body);
        await item.save();
        res.status(201).json(item);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// PUT /api/master/:collection/:id (Admin only)
router.put('/:collection/:id', authenticate, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { collection, id } = req.params;
        const model = MODEL_MAP[collection];
        if (!model) {
            res.status(404).json({ error: `Master collection "${collection}" not found.` });
            return;
        }
        const updated = await model.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) {
            res.status(404).json({ error: 'Item not found.' });
            return;
        }
        res.json(updated);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// DELETE /api/master/:collection/:id (Admin only)
router.delete('/:collection/:id', authenticate, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { collection, id } = req.params;
        const model = MODEL_MAP[collection];
        if (!model) {
            res.status(404).json({ error: `Master collection "${collection}" not found.` });
            return;
        }
        await model.findByIdAndDelete(id);
        res.json({ message: 'Deleted successfully.' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
export default router;
