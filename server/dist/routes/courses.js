import { Router } from 'express';
import { Course } from '../models/Course.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateCourse, computeCredits, computeCourseCode } from '@syllabusforge/shared';
import { generateDocxDocument } from '../services/docxGenerator.js';
import { generatePdfDocument } from '../services/pdfGenerator.js';
const router = Router();
// GET /api/courses
router.get('/', authenticate, async (req, res) => {
    try {
        const { programme, semester, status, courseType, search } = req.query;
        const filter = {};
        // Role-based visibility
        if (req.user?.role === 'FACULTY') {
            // Faculty can see courses they created or in their department or programme
            filter.$or = [
                { createdBy: req.user.email },
                { department: req.user.department },
                { programmeCode: { $in: req.user.programmeAccess || [] } },
            ];
        }
        else if (req.user?.role === 'HOD') {
            // HoD can see all courses in their department OR programmes
            const conditions = [];
            if (req.user.department) {
                conditions.push({ department: req.user.department });
            }
            if (req.user.programmeAccess && req.user.programmeAccess.length > 0) {
                conditions.push({ programmeCode: { $in: req.user.programmeAccess } });
            }
            if (conditions.length > 0) {
                filter.$or = conditions;
            }
        }
        if (programme)
            filter.programmeCode = programme;
        if (semester)
            filter.semester = Number(semester);
        if (status)
            filter.status = status;
        if (courseType)
            filter.courseType = courseType;
        if (search) {
            filter.$or = [
                { courseName: { $regex: search, $options: 'i' } },
                { courseCode: { $regex: search, $options: 'i' } },
            ];
        }
        const courses = await Course.find(filter).sort({ updatedAt: -1 });
        res.json(courses);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/courses/export (Export document from live draft course object)
router.post('/export', async (req, res) => {
    try {
        const format = req.query.format || req.body.format || 'docx';
        const courseData = req.body.course || req.body;
        if (!courseData) {
            res.status(400).json({ error: 'Course data is required for export.' });
            return;
        }
        const safeCode = (courseData.courseCode || 'Course').replace(/[^a-zA-Z0-9_-]/g, '_');
        const safeName = (courseData.courseName || 'Syllabus').replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${safeCode}_${safeName}`;
        if (format === 'pdf') {
            const pdfBuffer = await generatePdfDocument(courseData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
            res.send(pdfBuffer);
        }
        else {
            const docxBuffer = await generateDocxDocument(courseData);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
            res.send(docxBuffer);
        }
    }
    catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ error: `Export failed: ${err.message}` });
    }
});
// GET /api/courses/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            res.status(404).json({ error: 'Course not found.' });
            return;
        }
        res.json(course);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/courses (Create draft)
router.post('/', authenticate, async (req, res) => {
    try {
        const courseData = req.body;
        // Auto-calculate credits if not given
        if (courseData.L !== undefined && courseData.T !== undefined && courseData.P !== undefined) {
            courseData.credits = computeCredits(courseData.L, courseData.T, courseData.P, courseData.courseType);
        }
        // Auto-compute course code
        courseData.courseCode = computeCourseCode({
            regulationCode: courseData.regulationCode || '26',
            programmeCode: courseData.programmeCode,
            categoryLetter: courseData.categoryLetter,
            uniqueLetter: courseData.uniqueLetter,
            version: courseData.version !== undefined ? courseData.version : 0,
        });
        courseData.createdBy = req.user?.email || courseData.createdBy || 'unknown';
        courseData.department = courseData.department || req.user?.department || 'General';
        courseData.status = 'DRAFT';
        // Check if course with this compound key already exists
        const existing = await Course.findOne({
            regulationCode: courseData.regulationCode || '26',
            programmeCode: courseData.programmeCode,
            courseCode: courseData.courseCode,
            version: courseData.version !== undefined ? courseData.version : 0,
        });
        if (existing) {
            if (existing.status === 'FINALIZED') {
                res.status(400).json({
                    error: `Course ${courseData.courseCode} v${courseData.version} is finalized. Please clone as a new revision.`,
                });
                return;
            }
            // Update existing course document so saving a draft updates smoothly
            const updated = await Course.findByIdAndUpdate(existing._id, {
                ...courseData,
                department: courseData.department || existing.department || req.user?.department || 'General',
                updatedAt: new Date(),
            }, { new: true, runValidators: true });
            res.status(200).json(updated);
            return;
        }
        const course = new Course(courseData);
        await course.save();
        res.status(201).json(course);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// PUT /api/courses/:id (Update course / autosave)
router.put('/:id', authenticate, async (req, res) => {
    try {
        const existing = await Course.findById(req.params.id);
        if (!existing) {
            res.status(404).json({ error: 'Course not found.' });
            return;
        }
        // Check if course is locked (APPROVED / FINALIZED cannot be edited directly; must be revised)
        if (existing.status === 'FINALIZED') {
            res.status(400).json({ error: 'This course is locked/finalized. Create a revision to make edits.' });
            return;
        }
        const updateData = req.body;
        // Recalculate credits
        if (updateData.L !== undefined && updateData.T !== undefined && updateData.P !== undefined) {
            updateData.credits = computeCredits(updateData.L, updateData.T, updateData.P, updateData.courseType);
        }
        // Recalculate course code if components changed
        if (updateData.programmeCode || updateData.categoryLetter || updateData.uniqueLetter || updateData.regulationCode) {
            updateData.courseCode = computeCourseCode({
                regulationCode: updateData.regulationCode || existing.regulationCode,
                programmeCode: updateData.programmeCode || existing.programmeCode,
                categoryLetter: updateData.categoryLetter || existing.categoryLetter,
                uniqueLetter: updateData.uniqueLetter || existing.uniqueLetter,
                version: updateData.version !== undefined ? updateData.version : existing.version,
            });
        }
        // Prevent direct status escalation via normal PUT
        if (updateData.status && updateData.status !== existing.status) {
            delete updateData.status;
        }
        const updated = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.json(updated);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// DELETE /api/courses/:id
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            res.status(404).json({ error: 'Course not found.' });
            return;
        }
        if (course.status !== 'DRAFT' && req.user?.role !== 'ADMIN') {
            res.status(400).json({ error: 'Only drafts can be deleted.' });
            return;
        }
        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: 'Course deleted successfully.' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/courses/:id/validate
router.post('/:id/validate', authenticate, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            res.status(404).json({ error: 'Course not found.' });
            return;
        }
        // Fetch existing course codes for programme uniqueness
        const existingCourses = await Course.find({
            programmeCode: course.programmeCode,
            _id: { $ne: course._id },
        }).select('courseCode');
        const existingCodes = existingCourses.map(c => c.courseCode);
        const report = validateCourse(course.toObject(), existingCodes);
        res.json(report);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/courses/:id/submit
router.post('/:id/submit', authenticate, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            res.status(404).json({ error: 'Course not found.' });
            return;
        }
        const existingCourses = await Course.find({
            programmeCode: course.programmeCode,
            _id: { $ne: course._id },
        }).select('courseCode');
        const existingCodes = existingCourses.map(c => c.courseCode);
        const report = validateCourse(course.toObject(), existingCodes);
        if (!report.isValid) {
            const errorMsg = report.errors.map(e => e.message).join('; ');
            res.status(400).json({
                error: `Cannot submit course due to compliance errors: ${errorMsg}`,
                errors: report.errors,
                warnings: report.warnings,
            });
            return;
        }
        course.status = 'SUBMITTED';
        await course.save();
        res.json({ message: 'Course submitted successfully for review.', course, report });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/courses/:id/review
router.post('/:id/review', authenticate, requireRole(['HOD', 'ADMIN']), async (req, res) => {
    try {
        const { action, remarks, section } = req.body; // action: 'APPROVE' | 'RETURN'
        const course = await Course.findById(req.params.id);
        if (!course) {
            res.status(404).json({ error: 'Course not found.' });
            return;
        }
        if (remarks) {
            course.comments.push({
                userId: req.user.id,
                userName: req.user.name,
                userRole: req.user.role,
                section: section || 'General',
                comment: remarks,
                createdAt: new Date(),
                resolved: false,
            });
        }
        if (action === 'APPROVE') {
            course.status = req.user?.role === 'ADMIN' ? 'FINALIZED' : 'APPROVED';
        }
        else if (action === 'RETURN') {
            course.status = 'RETURNED';
        }
        else {
            res.status(400).json({ error: 'Invalid review action. Must be APPROVE or RETURN.' });
            return;
        }
        await course.save();
        res.json({ message: `Course ${action.toLowerCase()}ed successfully.`, course });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/courses/:id/revise
router.post('/:id/revise', authenticate, async (req, res) => {
    try {
        const original = await Course.findById(req.params.id);
        if (!original) {
            res.status(404).json({ error: 'Course not found.' });
            return;
        }
        const newVersion = (original.version || 0) + 1;
        const newCode = computeCourseCode({
            regulationCode: original.regulationCode,
            programmeCode: original.programmeCode,
            categoryLetter: original.categoryLetter,
            uniqueLetter: original.uniqueLetter,
            version: newVersion,
        });
        const clonedData = original.toObject();
        delete clonedData._id;
        delete clonedData.id;
        delete clonedData.createdAt;
        delete clonedData.updatedAt;
        clonedData.version = newVersion;
        clonedData.courseCode = newCode;
        clonedData.status = 'DRAFT';
        clonedData.revisionOf = original._id;
        clonedData.history = [
            ...(original.history || []),
            {
                version: original.version,
                updatedBy: req.user?.email || 'unknown',
                updatedAt: new Date().toISOString(),
                changesSummary: `Revision created from version ${original.version} to version ${newVersion}.`,
            },
        ];
        const revisedCourse = new Course(clonedData);
        await revisedCourse.save();
        res.status(201).json({
            message: `Course revision ${newVersion} created successfully.`,
            course: revisedCourse,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /api/courses/:id/export?format=docx|pdf
router.get('/:id/export', async (req, res) => {
    try {
        const { format = 'docx' } = req.query;
        const course = await Course.findById(req.params.id);
        if (!course) {
            res.status(404).json({ error: 'Course not found.' });
            return;
        }
        if (format === 'pdf') {
            const pdfBuffer = await generatePdfDocument(course.toObject());
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${course.courseCode}_${course.courseName.replace(/\s+/g, '_')}.pdf"`);
            res.send(pdfBuffer);
        }
        else {
            const docxBuffer = await generateDocxDocument(course.toObject());
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="${course.courseCode}_${course.courseName.replace(/\s+/g, '_')}.docx"`);
            res.send(docxBuffer);
        }
    }
    catch (err) {
        res.status(500).json({ error: `Export failed: ${err.message}` });
    }
});
export default router;
