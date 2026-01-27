const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const { isCourseLead } = require('../middleware/isCourseLead');

// --- All controller logic is now directly inside this router file ---

// Academic Year Functions
router.post('/years', isAuthenticated, isCourseLead, async (req, res) => {
    const { name, startDate, endDate, courseId } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
        return res.status(400).json({ error: 'Start date must be before end date.' });
    }

    try {
        const overlappingYear = await prisma.academicYear.findFirst({
            where: {
                courseId,
                OR: [
                    {
                        startDate: { lt: end },
                        endDate: { gt: start }
                    }
                ]
            }
        });

        if (overlappingYear) {
            return res.status(400).json({ error: 'Academic year dates overlap with an existing year for this course.' });
        }

        const academicYear = await prisma.academicYear.create({
            data: { name, startDate: start, endDate: end, courseId },
        });
        res.status(201).json(academicYear);
    } catch (error) {
        console.error('Error creating academic year:', error);
        res.status(400).json({ error: 'Error creating academic year. It may already exist for this course.' });
    }
});

router.get('/years', isAuthenticated, isCourseLead, async (req, res) => {
    try {
        const { courseId: queryCourseId } = req.query; // Renamed to avoid shadowing
        const where = {};

        // If a specific courseId is requested in the query, use it
        if (queryCourseId) {
            where.courseId = queryCourseId;
        } else if (req.user.role === 'LEAD') {
            // If the user is a LEAD and no specific courseId is queried, use their assigned leadCourseId
            if (!req.user.leadCourseId) {
                return res.status(403).json({ error: 'Lead is not assigned to any course.' });
            }
            where.courseId = req.user.leadCourseId;
        } else if (req.user.role !== 'ADMIN') {
            // For non-admin, non-lead users trying to access without courseId
            return res.status(403).json({ error: 'Access denied: Missing course context.' });
        }
        // Admins can view all academic years if no courseId is specified, so no 'else if' for them here.
        
        const academicYears = await prisma.academicYear.findMany({ 
            where, 
            orderBy: { startDate: 'desc' },
            include: { course: true } // Corrected: use singular 'course'
        });
        res.status(200).json(academicYears);
    } catch (error) {
        console.error('Error fetching academic years:', error);
        res.status(500).json({ error: 'Error fetching academic years.' });
    }
});

router.put('/years/:id', isAuthenticated, isCourseLead, async (req, res) => {
    const { id } = req.params;
    const { name, startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
        return res.status(400).json({ error: 'Start date must be before end date.' });
    }

    try {
        const yearToUpdate = await prisma.academicYear.findUnique({ 
            where: { id },
            include: { course: true } // Corrected: use singular 'course'
        });
        if (!yearToUpdate) {
            return res.status(404).json({ error: 'Academic year not found.' });
        }

        const currentCourseId = yearToUpdate.courseId; // Corrected: access directly
        if (!currentCourseId) {
            // This might indicate an academic year not properly linked,
            // or if `courseId` is truly optional, this check might need refinement.
            return res.status(400).json({ error: 'Academic year is not associated with any course.' });
        }

        const overlappingYear = await prisma.academicYear.findFirst({
            where: {
                id: { not: id },
                courseId: currentCourseId, // Corrected: use direct foreign key
                OR: [
                    {
                        startDate: { lt: end },
                        endDate: { gt: start }
                    }
                ]
            }
        });

        if (overlappingYear) {
            return res.status(400).json({ error: 'Academic year dates overlap with an existing year for this course.' });
        }

        const academicYear = await prisma.academicYear.update({
            where: { id },
            data: { name, startDate: start, endDate: end },
        });
        res.status(200).json(academicYear);
    } catch (error) {
        console.error('Error updating academic year:', error);
        res.status(400).json({ error: 'Error updating academic year.' });
    }
});

router.delete('/years/:id', isAuthenticated, isCourseLead, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.semester.deleteMany({
            where: { academicYearId: id },
        });

        // Removed the incorrect `courses: { set: [] }` update
        // as AcademicYear has a singular 'course' relation with a foreign key.

        await prisma.academicYear.delete({ where: { id } });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting academic year and its associations:', error);
        res.status(400).json({ error: 'Error deleting academic year. Ensure all dependencies are correctly handled.' });
    }
});

// Semester Functions
router.post('/semesters', isAuthenticated, isCourseLead, async (req, res) => {
    const { name, academicYearId, startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
        return res.status(400).json({ error: 'Start date must be before end date.' });
    }

    try {
        const academicYear = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
        if (!academicYear) {
            return res.status(404).json({ error: 'Academic year not found.' });
        }

        if (start < academicYear.startDate || end > academicYear.endDate) {
            return res.status(400).json({ error: 'Semester dates must be within the academic year.' });
        }

        const overlappingSemester = await prisma.semester.findFirst({
            where: {
                academicYearId: academicYearId,
                OR: [
                    {
                        startDate: { lt: end },
                        endDate: { gt: start }
                    }
                ]
            }
        });

        if (overlappingSemester) {
            return res.status(400).json({ error: 'Semester dates overlap with an existing semester in this academic year.' });
        }

        const semester = await prisma.semester.create({
            data: { name, academicYearId, startDate: start, endDate: end },
        });
        res.status(201).json(semester);
    } catch (error) {
        res.status(400).json({ error: 'Error creating semester. It may already exist for this academic year.' });
    }
});

router.get('/semesters/:academicYearId', isAuthenticated, isCourseLead, async (req, res) => {
    const { academicYearId } = req.params;
    try {
        const where = { academicYearId };
        if (req.user.role === 'LEAD') {
            const academicYear = await prisma.academicYear.findUnique({ 
                where: { id: academicYearId },
                include: { course: true } // Corrected: use singular 'course'
            });

            // Check if the lead's course is associated with this academic year via its foreign key
            if (!academicYear || academicYear.courseId !== req.user.leadCourseId) { // Corrected: access courseId directly
                return res.status(403).json({ error: 'You are not authorized to view these semesters' });
            }
        }
        const semesters = await prisma.semester.findMany({
            where,
            orderBy: { startDate: 'asc' },
        });
        res.status(200).json(semesters);
    } catch (error) {
        console.error('Error fetching semesters:', error);
        res.status(500).json({ error: 'Error fetching semesters.' });
    }
});

router.put('/semesters/:id', isAuthenticated, isCourseLead, async (req, res) => {
    const { id } = req.params;
    const { name, startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
        return res.status(400).json({ error: 'Start date must be before end date.' });
    }

    try {
        const semesterToUpdate = await prisma.semester.findUnique({ where: { id } });
        if (!semesterToUpdate) {
            return res.status(404).json({ error: 'Semester not found.' });
        }

        const academicYear = await prisma.academicYear.findUnique({ where: { id: semesterToUpdate.academicYearId } });
        if (!academicYear) {
            return res.status(404).json({ error: 'Academic year not found.' });
        }

        if (start < academicYear.startDate || end > academicYear.endDate) {
            return res.status(400).json({ error: 'Semester dates must be within the academic year.' });
        }

        const overlappingSemester = await prisma.semester.findFirst({
            where: {
                id: { not: id },
                academicYearId: semesterToUpdate.academicYearId,
                OR: [
                    {
                        startDate: { lt: end },
                        endDate: { gt: start }
                    }
                ]
            }
        });

        if (overlappingSemester) {
            return res.status(400).json({ error: 'Semester dates overlap with an existing semester in this academic year.' });
        }

        const semester = await prisma.semester.update({
            where: { id },
            data: { name, startDate: start, endDate: end },
        });
        res.status(200).json(semester);
    } catch (error) {
        res.status(400).json({ error: 'Error updating semester.' });
    }
});

router.delete('/semesters/:id', isAuthenticated, isCourseLead, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.offering.deleteMany({
            where: { semesterId: id },
        });

        await prisma.semester.delete({ where: { id } });
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting semester and its associations:', error);
        res.status(400).json({ error: 'Error deleting semester. Ensure all dependencies are correctly handled.' });
    }
});

// Curriculum Module Functions
router.get('/courses/:courseId', isAuthenticated, isCourseLead, async (req, res) => {
    const { courseId } = req.params;
    try {
        const curriculum = await prisma.module.findMany({
            where: { course_id: courseId },
            orderBy: [{ yearOfStudy: 'asc' }, { semesterOfStudy: 'asc' }],
            include: { competencies: true }, // Ensure competencies are included
        });
        res.status(200).json(curriculum);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching curriculum.' });
    }
});

// Offering Functions
router.post('/offerings', isAuthenticated, isCourseLead, async (req, res) => {
    const { moduleId, semesterId, assessorIds } = req.body;
    try {
        const offering = await prisma.offering.create({
            data: {
                moduleId,
                semesterId,
                assessors: {
                    create: assessorIds.map(assessorId => ({
                        assessor: { connect: { id: assessorId } }
                    }))
                }
            },
            include: {
                assessors: {
                    include: {
                        assessor: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });
        res.status(201).json(offering);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'This module is already offered in this semester.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Error creating offering.' });
    }
});

router.get('/offerings/:semesterId', isAuthenticated, isCourseLead, async (req, res) => {
    const { semesterId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    try {
        const where = { semesterId };

        const totalOfferings = await prisma.offering.count({ where });

        const offerings = await prisma.offering.findMany({
            where,
            skip: offset,
            take: limitNum,
            include: {
                module: true,
                semester: {
                    include: {
                        academicYear: true,
                    },
                },
                assessors: {
                    include: {
                        assessor: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        });

        res.status(200).json({
            offerings,
            totalPages: Math.ceil(totalOfferings / limitNum),
            currentPage: pageNum,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching offerings.' });
    }
});

router.put('/offerings/:offeringId/assessors', isAuthenticated, isCourseLead, async (req, res) => {
    const { offeringId } = req.params;
    const { assessorIds } = req.body;

    try {
        await prisma.$transaction([
            prisma.offeringAssignment.deleteMany({
                where: { offeringId: offeringId },
            }),
            ...assessorIds.map(assessorId =>
                prisma.offeringAssignment.create({
                    data: {
                        offeringId: offeringId,
                        assessorId: assessorId,
                    },
                })
            ),
        ]);

        const updatedOffering = await prisma.offering.findUnique({
            where: { id: offeringId },
            include: {
                module: true,
                assessors: {
                    include: {
                        assessor: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        });

        res.status(200).json(updatedOffering);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating offering assessors.' });
    }
});

router.put('/offerings/:offeringId', isAuthenticated, isCourseLead, async (req, res) => {
    const { offeringId } = req.params;
    const { moduleId, semesterId, assessorIds } = req.body; // Added assessorIds

    if (!moduleId && !semesterId && !assessorIds) {
        return res.status(400).json({ error: 'At least one of moduleId, semesterId, or assessorIds must be provided for update.' });
    }

    try {
        const offeringToUpdate = await prisma.offering.findUnique({ where: { id: offeringId } });
        if (!offeringToUpdate) {
            return res.status(404).json({ error: 'Offering not found.' });
        }

        // Prevent updating to an existing unique combination of moduleId and semesterId
        if (moduleId || semesterId) {
            const targetModuleId = moduleId || offeringToUpdate.moduleId;
            const targetSemesterId = semesterId || offeringToUpdate.semesterId;

            const existingOffering = await prisma.offering.findFirst({
                where: {
                    moduleId: targetModuleId,
                    semesterId: targetSemesterId,
                    NOT: { id: offeringId }, // Exclude the current offering being updated
                },
            });

            if (existingOffering) {
                return res.status(400).json({ error: 'An offering for this module already exists in the selected semester.' });
            }
        }

        const transactionOperations = [];
        const dataToUpdate = {};

        if (moduleId) dataToUpdate.moduleId = moduleId;
        if (semesterId) dataToUpdate.semesterId = semesterId;

        if (assessorIds !== undefined) { // Check if assessorIds is explicitly provided
            transactionOperations.push(
                prisma.offeringAssignment.deleteMany({
                    where: { offeringId: offeringId },
                })
            );
            if (assessorIds.length > 0) {
                transactionOperations.push(
                    ...assessorIds.map(assessorId =>
                        prisma.offeringAssignment.create({
                            data: {
                                offeringId: offeringId,
                                assessorId: assessorId,
                            },
                        })
                    )
                );
            }
        }

        transactionOperations.push(
            prisma.offering.update({
                where: { id: offeringId },
                data: dataToUpdate,
                include: { // Include necessary relations for the response
                    module: true,
                    semester: {
                        include: {
                            academicYear: true,
                        },
                    },
                    assessors: {
                        include: {
                            assessor: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                },
            })
        );
        
        const [ , updatedOffering] = await prisma.$transaction(transactionOperations);
        res.status(200).json(updatedOffering);
    } catch (error) {
        console.error('Error updating offering:', error);
        res.status(500).json({ error: 'Error updating offering.' });
    }
});

module.exports = router;