import { Router } from 'express';
import { Course } from '../models/Course.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateCourse, computeCredits, computeCourseCode, getDepartmentForProgramme } from '@syllabusforge/shared';
import { generateDocxDocument, generateMergedCoursesDocx } from '../services/docxGenerator.js';
import { generatePdfDocument, generateMergedCoursesPdf } from '../services/pdfGenerator.js';
const router = Router();
// Helper to escape regex special characters
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
// GET /api/courses
router.get('/', authenticate, async (req, res) => {
    try {
        const { programme, semester, status, courseType, search, scope } = req.query;
        const filter = {};
        const andConditions = [];
        const userEmail = (req.user?.email || '').trim().toLowerCase();
        const userId = String(req.user?.id || '');
        const userName = (req.user?.name || '').trim();
        // If scope is 'all', bypass user filter (used by CourseWizard for code uniqueness checks)
        if (scope === 'all') {
            // No user restriction
        }
        else if (scope === 'review' && (req.user?.role === 'HOD' || req.user?.role === 'ADMIN' || req.user?.role === 'BOS_COORDINATOR')) {
            // HoD/Admin/BOS Coordinator institutional review queue:
            // Allow filtering by selected department (e.g. when coordinator or admin switches department view)
            const targetDept = req.query.department ? String(req.query.department).trim() : (req.user.role === 'ADMIN' ? '' : req.user.department);
            const conditions = [];
            if (targetDept) {
                conditions.push({ department: targetDept });
            }
            else if (req.user.department && req.user.role !== 'ADMIN') {
                conditions.push({ department: req.user.department });
            }
            if (req.user.programmeAccess && req.user.programmeAccess.length > 0 && req.user.role !== 'ADMIN') {
                conditions.push({ programmeCode: { $in: req.user.programmeAccess } });
            }
            if (conditions.length > 0) {
                andConditions.push({ $or: conditions });
            }
        }
        else if (req.user?.role === 'ADMIN') {
            // Admin dashboard: By default, institutional admin can view all courses across departments.
            // If admin explicitly requests their personal drafts, scope='mine' is used.
            if (scope === 'mine') {
                const userConditions = [];
                if (userEmail) {
                    const escapedEmail = escapeRegex(userEmail);
                    userConditions.push({ createdBy: { $regex: `^${escapedEmail}$`, $options: 'i' } });
                    userConditions.push({ 'designers.email': { $regex: `^${escapedEmail}$`, $options: 'i' } });
                }
                if (userId) {
                    userConditions.push({ createdBy: userId });
                }
                if (userConditions.length > 0) {
                    andConditions.push({ $or: userConditions });
                }
            }
        }
        else if (req.user?.role === 'HOD' || req.user?.role === 'BOS_COORDINATOR') {
            // HoD dashboard: view own authored courses as well as courses in their department
            if (scope === 'mine') {
                const userConditions = [];
                if (userEmail) {
                    const escapedEmail = escapeRegex(userEmail);
                    userConditions.push({ createdBy: { $regex: `^${escapedEmail}$`, $options: 'i' } });
                    userConditions.push({ 'designers.email': { $regex: `^${escapedEmail}$`, $options: 'i' } });
                }
                if (userId) {
                    userConditions.push({ createdBy: userId });
                }
                if (userConditions.length > 0) {
                    andConditions.push({ $or: userConditions });
                }
            }
            else {
                const hodConditions = [];
                if (userEmail) {
                    const escapedEmail = escapeRegex(userEmail);
                    hodConditions.push({ createdBy: { $regex: `^${escapedEmail}$`, $options: 'i' } });
                    hodConditions.push({ 'designers.email': { $regex: `^${escapedEmail}$`, $options: 'i' } });
                }
                if (userId) {
                    hodConditions.push({ createdBy: userId });
                }
                if (req.user.department) {
                    hodConditions.push({ department: req.user.department });
                }
                if (req.user.programmeAccess && req.user.programmeAccess.length > 0) {
                    hodConditions.push({ programmeCode: { $in: req.user.programmeAccess } });
                }
                if (hodConditions.length > 0) {
                    andConditions.push({ $or: hodConditions });
                }
            }
        }
        else {
            // By default: ONLY documents saved or submitted by the logged-in user are shown
            const userConditions = [];
            if (userEmail) {
                const escapedEmail = escapeRegex(userEmail);
                userConditions.push({ createdBy: { $regex: `^${escapedEmail}$`, $options: 'i' } });
                userConditions.push({ 'designers.email': { $regex: `^${escapedEmail}$`, $options: 'i' } });
            }
            if (userId) {
                userConditions.push({ createdBy: userId });
            }
            if (userName) {
                const escapedName = escapeRegex(userName);
                userConditions.push({ 'designers.name': { $regex: `^${escapedName}$`, $options: 'i' } });
            }
            if (userConditions.length > 0) {
                andConditions.push({ $or: userConditions });
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
            andConditions.push({
                $or: [
                    { courseName: { $regex: search, $options: 'i' } },
                    { courseCode: { $regex: search, $options: 'i' } },
                ],
            });
        }
        if (andConditions.length > 0) {
            filter.$and = andConditions;
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
        const { includeApprovalFooter = false, bosMeetingText, academicCouncilText, } = req.body;
        const exportOptions = {
            includeApprovalFooter: Boolean(includeApprovalFooter),
            bosMeetingText: bosMeetingText ? String(bosMeetingText) : undefined,
            academicCouncilText: academicCouncilText ? String(academicCouncilText) : undefined,
        };
        const safeCode = (courseData.courseCode || 'Course').replace(/[^a-zA-Z0-9_-]/g, '_');
        const safeName = (courseData.courseName || 'Syllabus').replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${safeCode}_${safeName}`;
        if (format === 'pdf') {
            const pdfBuffer = await generatePdfDocument(courseData, exportOptions);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
            res.send(pdfBuffer);
        }
        else {
            const docxBuffer = await generateDocxDocument(courseData, exportOptions);
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
// GET /api/courses/existing-codes - Lightweight list of all registered course codes across all programmes
router.get('/existing-codes', authenticate, async (req, res) => {
    try {
        const list = await Course.find({}, {
            _id: 1,
            courseCode: 1,
            courseName: 1,
            programmeCode: 1,
            regulationCode: 1,
            categoryLetter: 1,
            uniqueLetter: 1,
            version: 1,
            status: 1,
            createdBy: 1,
        }).lean();
        res.json(list);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
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
        if (!courseData.teExamType || courseData.teExamType === '') {
            delete courseData.teExamType;
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
            const isOwner = existing.createdBy &&
                req.user?.email &&
                existing.createdBy.trim().toLowerCase() === req.user.email.trim().toLowerCase();
            // If existing course is SUBMITTED, APPROVED, or FINALIZED, it CANNOT be overwritten!
            if (existing.status !== 'DRAFT') {
                res.status(400).json({
                    error: `Course ${courseData.courseCode} v${courseData.version} is already ${existing.status} ("${existing.courseName || 'Existing syllabus'}"). It cannot be overwritten. Please choose a different unique course letter.`,
                });
                return;
            }
            // If existing draft belongs to a different faculty member, NEVER overwrite someone else's work!
            if (!isOwner && req.user?.role !== 'ADMIN') {
                res.status(400).json({
                    error: `Course code ${courseData.courseCode} is already reserved by another faculty member (${existing.createdBy}). Please choose a different unique course letter.`,
                });
                return;
            }
            // Only if it's the author's own DRAFT, update it smoothly
            const updated = await Course.findByIdAndUpdate(existing._id, {
                ...courseData,
                status: 'DRAFT',
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
        if (updateData.teExamType === '') {
            delete updateData.teExamType;
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
        // Check if course code collides with another existing course
        const targetCode = updateData.courseCode || existing.courseCode;
        if (targetCode) {
            const duplicate = await Course.findOne({
                _id: { $ne: existing._id },
                regulationCode: updateData.regulationCode || existing.regulationCode,
                programmeCode: updateData.programmeCode || existing.programmeCode,
                courseCode: targetCode,
                version: updateData.version !== undefined ? updateData.version : existing.version,
            });
            if (duplicate) {
                res.status(400).json({
                    error: `Course code ${targetCode} is already in use by "${duplicate.courseName || 'another course'}" (${duplicate.status}). Please choose a different unique course letter.`,
                });
                return;
            }
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
        const userRole = req.user?.role;
        const userEmail = (req.user?.email || '').trim().toLowerCase();
        const userDept = (req.user?.department || '').trim().toLowerCase();
        const courseDept = (course.department || getDepartmentForProgramme(course.programmeCode) || '').trim().toLowerCase();
        const progAccess = (req.user?.programmeAccess || []).map((p) => p.toUpperCase());
        const isDeptMatch = (userDept && courseDept && userDept === courseDept) ||
            (course.programmeCode && progAccess.includes(course.programmeCode.toUpperCase()));
        const isDeptCoordOrHod = (userRole === 'BOS_COORDINATOR' || userRole === 'HOD') && isDeptMatch;
        const isAdmin = userRole === 'ADMIN';
        // Check if requester is designer/author
        const isAuthor = course.createdBy?.toLowerCase() === userEmail ||
            (Array.isArray(course.designers) && course.designers.some((d) => d.email?.toLowerCase() === userEmail));
        // Admin can delete any course in any status
        if (isAdmin) {
            await Course.findByIdAndDelete(req.params.id);
            res.json({ message: 'Course deleted successfully.' });
            return;
        }
        // BOS Coordinator (or HoD) of that department can delete submitted, returned, or draft courses in their department
        if (isDeptCoordOrHod && (course.status === 'SUBMITTED' || course.status === 'RETURNED' || course.status === 'DRAFT')) {
            await Course.findByIdAndDelete(req.params.id);
            res.json({ message: 'Course deleted successfully by department coordinator.' });
            return;
        }
        // Faculty author can only delete their own DRAFT courses
        if (course.status === 'DRAFT' && isAuthor) {
            await Course.findByIdAndDelete(req.params.id);
            res.json({ message: 'Course deleted successfully.' });
            return;
        }
        res.status(403).json({ error: 'You do not have permission to delete this course.' });
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
        const { format = 'docx', includeApprovalFooter = 'false', bosMeetingText, academicCouncilText, } = req.query;
        const course = await Course.findById(req.params.id);
        if (!course) {
            res.status(404).json({ error: 'Course not found.' });
            return;
        }
        const exportOptions = {
            includeApprovalFooter: includeApprovalFooter === 'true',
            bosMeetingText: bosMeetingText ? String(bosMeetingText) : undefined,
            academicCouncilText: academicCouncilText ? String(academicCouncilText) : undefined,
        };
        if (format === 'pdf') {
            const pdfBuffer = await generatePdfDocument(course.toObject(), exportOptions);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${course.courseCode}_${course.courseName.replace(/\s+/g, '_')}.pdf"`);
            res.send(pdfBuffer);
        }
        else {
            const docxBuffer = await generateDocxDocument(course.toObject(), exportOptions);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="${course.courseCode}_${course.courseName.replace(/\s+/g, '_')}.docx"`);
            res.send(docxBuffer);
        }
    }
    catch (err) {
        res.status(500).json({ error: `Export failed: ${err.message}` });
    }
});
// POST /api/courses/merge - Merge selected courses in explicit order into one DOCX or PDF bundle (or HTML bundle for browser printing)
router.post('/merge', authenticate, async (req, res) => {
    try {
        const { courseIds, format = 'docx', regulationYear = 2026, annexureNo = '01', includeApprovalFooter = true, bosMeetingText, academicCouncilText, } = req.body;
        if (!Array.isArray(courseIds) || courseIds.length === 0) {
            res.status(400).json({ error: 'Please select at least one course to merge.' });
            return;
        }
        // Fetch the courses
        const fetchedCourses = await Course.find({ _id: { $in: courseIds } });
        if (fetchedCourses.length === 0) {
            res.status(404).json({ error: 'No courses found for the given IDs.' });
            return;
        }
        // Preserve the EXACT order requested by the client
        const courseMap = new Map();
        fetchedCourses.forEach(c => courseMap.set(c._id.toString(), c.toObject()));
        const orderedCourses = [];
        for (const id of courseIds) {
            const c = courseMap.get(id.toString());
            if (c) {
                orderedCourses.push(c);
            }
        }
        if (orderedCourses.length === 0) {
            res.status(404).json({ error: 'Selected courses could not be compiled.' });
            return;
        }
        const deptName = orderedCourses[0]?.department || req.user?.department || 'Curriculum';
        const deptSlug = deptName.replace(/[^a-zA-Z0-9]/g, '_');
        const mergeMetadata = {
            department: deptName,
            regulationYear: Number(regulationYear),
            includeApprovalFooter: Boolean(includeApprovalFooter),
            bosMeetingText: bosMeetingText ? String(bosMeetingText) : undefined,
            academicCouncilText: academicCouncilText ? String(academicCouncilText) : undefined,
        };
        if (format === 'html') {
            const { generateMergedCoursesHtml } = await import('../services/pdfGenerator.js');
            const html = generateMergedCoursesHtml(orderedCourses, mergeMetadata);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(html);
        }
        else if (format === 'pdf') {
            try {
                const pdfBuffer = await generateMergedCoursesPdf(orderedCourses, mergeMetadata);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="Curriculum_Bundle_${deptSlug}_${regulationYear}.pdf"`);
                res.send(pdfBuffer);
            }
            catch (pdfErr) {
                // Fallback: If Puppeteer or Chromium is missing in the hosting environment (e.g. AWS Lambda / Vercel),
                // send back the printable HTML so the client can trigger instant pixel-perfect PDF print dialog!
                console.warn('Server Puppeteer unavailable, falling back to printable HTML bundle:', pdfErr.message);
                const { generateMergedCoursesHtml } = await import('../services/pdfGenerator.js');
                const html = generateMergedCoursesHtml(orderedCourses, mergeMetadata);
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader('X-Fallback-Print', 'true');
                res.send(html);
            }
        }
        else {
            const docxBuffer = await generateMergedCoursesDocx(orderedCourses, mergeMetadata);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="Curriculum_Bundle_${deptSlug}_${regulationYear}.docx"`);
            res.send(docxBuffer);
        }
    }
    catch (err) {
        res.status(500).json({ error: `Merge compilation failed: ${err.message}` });
    }
});
export default router;
