const prisma = require('../lib/prisma');

const isCourseLead = async (req, res, next) => {
    if (req.user.role === 'ADMIN') {
        return next();
    }

    let courseId = req.params.courseId || req.params.course_id || req.body.course_id || req.body.courseId || req.query.course_id || req.query.courseId;

    if (!courseId) {
        const semesterId = req.params.semesterId || req.body.semesterId;
        const offeringId = req.body.offeringId || req.params.offeringId;
        const moduleId = req.params.module_id || req.body.moduleId;
        const academicYearId = req.body.academicYearId || req.params.academicYearId;
        const { id } = req.params;

        if (moduleId) {
            const module = await prisma.module.findUnique({ where: { module_id: moduleId } });
            if (!module) return res.status(404).json({ error: 'Module not found' });
            courseId = module.course_id;
        } else if (offeringId) {
            const offering = await prisma.offering.findUnique({ where: { id: offeringId }, include: { module: true } });
            if (!offering) return res.status(404).json({ error: 'Offering not found' });
            courseId = offering.module.course_id;
        } else if (academicYearId) { 
            const academicYear = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
            if (!academicYear) return res.status(404).json({ error: 'Academic year not found' });
            courseId = academicYear.courseId;
        } else if (semesterId) {
            const semester = await prisma.semester.findUnique({ where: { id: semesterId }, include: { academicYear: true } });
            if (!semester) return res.status(404).json({ error: 'Semester not found' });
            courseId = semester.academicYear.courseId;
        } else if (id) {
            const semester = await prisma.semester.findUnique({
                where: { id },
                include: { academicYear: true },
            });

            if (semester) {
                courseId = semester.academicYear.courseId;
            } else {
                const academicYear = await prisma.academicYear.findUnique({ where: { id } });
                if (academicYear) {
                    courseId = academicYear.courseId;
                }
            }
        }
    }

    if (!courseId) {
        return res.status(400).json({ error: 'Missing courseId' });
    }

    const assessor = await prisma.assessor.findUnique({ where: { userId: req.user.userId } });
    if (!assessor) {
        return res.status(404).json({ error: 'Assessor profile not found' });
    }

    const courseAssignment = await prisma.courseAssignment.findFirst({
        where: {
            assessorId: assessor.id,
            role: 'LEAD',
            courseId: courseId,
        },
    });

    if (!courseAssignment) {
        return res.status(403).json({ error: 'You are not the lead for this course' });
    }
    
    // Attach courseId to req.user for easier access in route handlers
    req.user.leadCourseId = courseId;
    
    next();
};

module.exports = { isCourseLead };
