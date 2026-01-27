const prisma = require('../lib/prisma');

// @desc    Create a new module
// @route   POST /api/lead/create-module
// @access  Private/Lead
const createModule = async (req, res) => {
  const { course_id, moduleCode, title, description, version, status, yearOfStudy, semesterOfStudy, competencyIds } = req.body;
  const createdBy = req.user.userId;

  if (!course_id || !moduleCode || !title) {
    return res.status(400).json({ error: 'course_id, moduleCode, and title are required' });
  }

  try {
    // Authorization check: Ensure the user is a lead for the course or an admin.
    const isCourseLead = await prisma.courseAssignment.findFirst({
      where: {
        courseId: course_id,
        assessor: {
          userId: createdBy,
        },
        role: 'LEAD',
      },
    });

    if (!isCourseLead && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not authorized to create a module for this course.' });
    }

    const module = await prisma.module.create({
      data: {
        course: { connect: { course_id } },
        moduleCode,
        title,
        description,
        version: parseInt(version, 10),
        status,
        yearOfStudy,
        semesterOfStudy,
        createdBy: createdBy, // Correctly assign the creator's user ID.
        competencies: {
          connect: competencyIds ? competencyIds.map(id => ({ id })) : [],
        },
      },
      include: {
        competencies: true, // Include competencies to return
      },
    });
    res.status(201).json(module);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A module with this code already exists for this course.' });
    }
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating the module.' });
  }
};

// @desc    Publish a module
// @route   PUT /api/lead/publish-module/:module_id
// @access  Private/Lead
const publishModule = async (req, res) => {
  const { module_id } = req.params;

  if (!module_id) {
    return res.status(400).json({ error: 'module_id is required' });
  }

  try {
    const module = await prisma.module.update({
      where: { module_id },
      data: { status: 'PUBLISHED' },
    });
    res.json(module);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while publishing the module' });
  }
};

// @desc    Assign assessors to a module
// @route   POST /api/lead/assign-assessors-to-module
// @access  Private/Lead
const assignAssessorsToModule = async (req, res) => {
  const { module_id, assessor_ids } = req.body;

  if (!module_id || !assessor_ids || !Array.isArray(assessor_ids) || assessor_ids.length === 0) {
    return res.status(400).json({ error: 'module_id and a non-empty array of assessor_ids are required' });
  }

  try {
    const assignments = await prisma.$transaction(
      assessor_ids.map((assessor_id) =>
        prisma.moduleAssignment.upsert({
          where: { moduleId_assessorId: { moduleId: module_id, assessorId: assessor_id } },
          update: {},
          create: { moduleId: module_id, assessorId: assessor_id },
        })
      )
    );
    res.status(201).json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while assigning assessors' });
  }
};

// @desc    Unassign an assessor from a module
// @route   POST /api/lead/unassign-assessor
// @access  Private/Lead
const unassignAssessor = async (req, res) => {
  const { moduleId, assessorId } = req.body;

  if (!moduleId || !assessorId) {
    return res.status(400).json({ error: 'moduleId and assessorId are required' });
  }

  try {
    await prisma.moduleAssignment.delete({
      where: { moduleId_assessorId: { moduleId, assessorId } },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while unassigning the assessor' });
  }
};

// @desc    Get all modules for a course
// @route   GET /api/lead/modules/:course_id
// @access  Private/Lead
const getModulesForCourse = async (req, res) => {
  const { course_id } = req.params;

  if (!course_id) {
    return res.status(400).json({ error: 'course_id is required' });
  }

  try {
    const modules = await prisma.module.findMany({
      where: { course_id },
    });
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching modules' });
  }
};

// @desc    Get all assessors for a course
// @route   GET /api/lead/courses/:course_id/assessors
// @access  Private/Lead
const getAssessorsForCourse = async (req, res) => {
  const { course_id } = req.params;

  if (!course_id) {
    return res.status(400).json({ error: 'course_id is required' });
  }

  try {
    const courseAssignments = await prisma.courseAssignment.findMany({
      where: { courseId: course_id },
      include: {
        assessor: {
          include: {
            user: true,
          },
        },
      },
    });

    const assessors = courseAssignments.map((assignment) => assignment.assessor);
    res.json(assessors);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching assessors' });
  }
};

const getAllAssessors = async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;

  try {
    const where = {
      assessor: {
        isNot: null,
      },
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    };

    const assessors = await prisma.user.findMany({
      where,
      skip: offset,
      take: limitNum,
      include: {
        assessor: {
          include: {
            courseAssignments: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    const totalAssessors = await prisma.user.count({ where });

    res.json({
      assessors,
      totalPages: Math.ceil(totalAssessors / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching assessors.' });
  }
};

const getMyCourse = async (req, res) => {
    try {
        const assessor = await prisma.assessor.findUnique({
            where: { userId: req.user.userId },
        });

        if (!assessor) {
            return res.status(404).json({ error: 'Assessor not found for the current user.' });
        }

        const courseAssignment = await prisma.courseAssignment.findFirst({
            where: {
                assessorId: assessor.id,
                role: 'LEAD',
            },
            include: {
                course: {
                    include: {
                        modules: true,
                    },
                },
            },
        });

        if (!courseAssignment) {
            return res.status(404).json({ error: 'No course found where you are a lead.' });
        }

        res.json(courseAssignment.course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getLeadByUserId = async (userId) => {
  return await prisma.assessor.findUnique({
    where: { userId },
  });
};

const updateModule = async (req, res) => {
  const { module_id } = req.params;
  const { moduleCode, title, description, version, status, yearOfStudy, semesterOfStudy, competencyIds } = req.body;
  const userId = req.user.userId;

  try {
    const lead = await getLeadByUserId(userId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const module = await prisma.module.findUnique({
      where: { module_id },
      include: { course: true },
    });

    if (!module) {
      return res.status(404).json({ error: 'Module not found.' });
    }

    const isCourseLead = await prisma.courseAssignment.findFirst({
      where: {
        courseId: module.course.course_id,
        assessorId: lead.id,
        role: 'LEAD',
      },
    });

    if (!isCourseLead) {
      return res.status(403).json({ error: 'You are not authorized to edit this module.' });
    }

    const updatedModule = await prisma.module.update({
      where: { module_id },
      data: {
        moduleCode,
        title,
        description,
        version: parseInt(version, 10),
        status,
        yearOfStudy,
        semesterOfStudy,
        competencies: {
          set: competencyIds ? competencyIds.map(id => ({ id })) : [],
        },
      },
      include: {
        competencies: true, // Include competencies in the response
      },
    });

    res.json(updatedModule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the module.' });
  }
};

const deleteModule = async (req, res) => {
  const { module_id } = req.params;
  const userId = req.user.userId;

  try {
    const lead = await getLeadByUserId(userId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const module = await prisma.module.findUnique({
      where: { module_id },
      include: { course: true },
    });

    if (!module) {
      return res.status(404).json({ error: 'Module not found.' });
    }

    const isCourseLead = await prisma.courseAssignment.findFirst({
      where: {
        courseId: module.course.course_id,
        assessorId: lead.id,
        role: 'LEAD',
      },
    });

    if (!isCourseLead) {
      return res.status(403).json({ error: 'You are not authorized to delete this module.' });
    }

    await prisma.$transaction(async (tx) => {
      const offerings = await tx.offering.findMany({
        where: { moduleId: module_id },
        select: { id: true },
      });
      const offeringIds = offerings.map((o) => o.id);

      if (offeringIds.length > 0) {
        await tx.enrollment.deleteMany({
          where: { offeringId: { in: offeringIds } },
        });
        await tx.offeringAssignment.deleteMany({
          where: { offeringId: { in: offeringIds } },
        });
      }

      await tx.offering.deleteMany({
        where: { moduleId: module_id },
      });

      const assessments = await tx.assessment.findMany({
        where: { module_id: module_id },
        select: { assessment_id: true },
      });
      const assessmentIds = assessments.map((a) => a.assessment_id);

      if (assessmentIds.length > 0) {
        await tx.submission.deleteMany({
          where: { assessment_id: { in: assessmentIds } },
        });
      }

      await tx.assessment.deleteMany({
        where: { module_id: module_id },
      });

      await tx.observation.deleteMany({
        where: { module_id: module_id },
      });

      await tx.microCredential.deleteMany({
        where: { module_id: module_id },
      });

      await tx.announcement.deleteMany({
        where: { moduleId: module_id },
      });

      await tx.module.delete({
        where: { module_id },
      });
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while deleting the module.' });
  }
};

const migrateStudents = async (req, res) => {
  const { moduleId, oldAssessorId, newAssessorId } = req.body;

  if (!moduleId || !oldAssessorId || !newAssessorId) {
    return res.status(400).json({ error: 'moduleId, oldAssessorId, and newAssessorId are required' });
  }

  try {
    await prisma.$transaction(async (prisma) => {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          module_id: moduleId,
          assessor_id: oldAssessorId,
        },
      });

      const studentIds = enrollments.map(e => e.student_id);

      await prisma.observation.updateMany({
        where: {
          module_id: moduleId,
          student_id: { in: studentIds },
        },
        data: {
          assessor_id: newAssessorId,
        },
      });

      await prisma.enrollment.updateMany({
        where: {
          module_id: moduleId,
          assessor_id: oldAssessorId,
        },
        data: {
          assessor_id: newAssessorId,
        },
      });

      await prisma.moduleAssignment.delete({
        where: { moduleId_assessorId: { moduleId: moduleId, assessorId: oldAssessorId } },
      });
    });

    res.json({ message: 'Students migrated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while migrating students' });
  }
};

const getCourseModules = async (req, res) => {
  const { course_id } = req.params;

  try {
    const course = await prisma.course.findUnique({
      where: { course_id },
      include: {
        modules:
         true,
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course.modules);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the course credential rule' });
  }
};

const getAllModules = async (req, res) => {
    try {
        const modules = await prisma.module.findMany();
        res.json(modules);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching modules' });
    }
};

const updateCourseCredentialRule = async (req, res) => {
  const { course_id } = req.params;
  const { module_ids } = req.body;

  try {
    const course = await prisma.course.update({
      where: { course_id },
      data: {
        credentialModuleIds: module_ids,
      },
    });

    // --- RE-EVALUATE STUDENTS ---
    // Fetch all students enrolled in any module of this course
    const enrollments = await prisma.enrollment.findMany({
        where: {
            module: {
                course_id: course_id
            }
        },
        select: {
            student_id: true
        },
        distinct: ['student_id']
    });

    const { checkAndIssueCourseCredential } = require('../lib/credentialHelpers');

    // Re-evaluate each student. We set isFinalEvent to true so they get on-chain issuance if they qualify.
    for (const enrollment of enrollments) {
        try {
            await checkAndIssueCourseCredential(enrollment.student_id, course_id, true);
        } catch (error) {
            console.error(`Error re-evaluating course credential for student ${enrollment.student_id}:`, error);
        }
    }

    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the course credential rule' });
  }
};

const getCourseById = async (req, res) => {
  const { course_id } = req.params;
  try {
    const course = await prisma.course.findUnique({
      where: { course_id: course_id },
      include: {
        modules: true,
        competencies: true, // Include the course's competencies
        courseAssignments: {
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
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the course' });
  }
};

const getStudentsForCourse = async (req, res) => {
    const { course_id } = req.params;
    try {
        const enrollments = await prisma.enrollment.findMany({
            where: {
                offering: {
                    module: {
                        course_id: course_id,
                    },
                },
            },
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        const students = enrollments.map(e => e.student);
        const uniqueStudents = [...new Map(students.map(item => [item.id, item])).values()];

        res.json(uniqueStudents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching students' });
    }
};

const importModules = async (req, res) => {
  const { course_id } = req.query;
  const { modules } = req.body;
  const createdBy = req.user.userId;

  if (!course_id || !modules || !Array.isArray(modules)) {
    return res.status(400).json({ error: 'course_id and a non-empty array of modules are required' });
  }

  const created = [];
  const duplicates = [];
  const errors = [];

  try {
    const allCompetencyNames = [...new Set(modules.flatMap(m => m.competencyNames || []))];
    const competenciesFromDb = await prisma.competency.findMany({
      where: { name: { in: allCompetencyNames, mode: 'insensitive' } },
      select: { id: true, name: true },
    });
    
    const competencyNameToIdMap = new Map(competenciesFromDb.map(c => [c.name.toLowerCase(), c.id]));

    for (const moduleData of modules) {
      const { moduleCode, title, description, version, status, yearOfStudy, semesterOfStudy, competencyNames } = moduleData;

      if (!moduleCode || !title) {
        errors.push({ title: moduleData.title || 'N/A', moduleCode: moduleData.moduleCode || 'N/A', error: 'moduleCode and title are required' });
        continue;
      }

      try {
        const existingModule = await prisma.module.findFirst({
          where: { course_id, moduleCode },
        });

        if (existingModule) {
          duplicates.push(moduleData);
          continue;
        }

        const foundCompetencyIds = [];
        const missingCompetencyNames = [];

        if (competencyNames) {
          for (const name of competencyNames) {
            const id = competencyNameToIdMap.get(name.toLowerCase());
            if (id) {
              foundCompetencyIds.push(id);
            } else {
              missingCompetencyNames.push(name);
            }
          }
        }

        const newModule = await prisma.module.create({
          data: {
            course: { connect: { course_id } },
            moduleCode,
            title,
            description,
            version: version ? parseInt(version, 10) : undefined,
            status: ['DRAFT', 'PUBLISHED', 'DEPRECATED'].includes(status) ? status : 'DRAFT',
            yearOfStudy: yearOfStudy ? parseInt(yearOfStudy, 10) : undefined,
            semesterOfStudy: semesterOfStudy ? parseInt(semesterOfStudy, 10) : undefined,
            createdBy,
            competencies: {
              connect: foundCompetencyIds.map(id => ({ id })),
            },
          },
        });
        created.push(newModule);

        if (missingCompetencyNames.length > 0) {
          errors.push({
            title: newModule.title,
            moduleCode: newModule.moduleCode,
            error: `Module created, but the following competencies were not found and could not be associated: ${missingCompetencyNames.join(', ')}`,
          });
        }
      } catch (error) {
        errors.push({ title: moduleData.title, moduleCode: moduleData.moduleCode, error: error.message });
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'An unexpected error occurred during the import process.' });
  }

  res.status(201).json({
    message: 'Module import process completed.',
    created: created.length,
    duplicates: duplicates.length,
    errors,
  });
};


const assignAssessorToStudent = async (req, res) => {
    const { enrollmentId, assessorId } = req.body;
    const { userId } = req.user;

    if (!enrollmentId || !assessorId) {
        return res.status(400).json({ error: 'enrollmentId and assessorId are required' });
    }

    try {
        const leadAssessor = await prisma.assessor.findUnique({ where: { userId } });
        if (!leadAssessor) {
            return res.status(404).json({ error: 'Lead assessor profile not found.' });
        }

        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            include: {
                offering: {
                    include: {
                        module: true
                    }
                }
            }
        });

        if (!enrollment) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        const courseId = enrollment.offering.module.course_id;

        const courseAssignment = await prisma.courseAssignment.findFirst({
            where: {
                courseId: courseId,
                assessorId: leadAssessor.id,
                role: 'LEAD',
            }
        });

        if (!courseAssignment && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'You are not authorized to assign assessors for this course.' });
        }

        const offeringAssignment = await prisma.offeringAssignment.findFirst({
            where: {
                offeringId: enrollment.offeringId,
                assessorId: assessorId,
            }
        });

        if (!offeringAssignment) {
            return res.status(400).json({ error: 'The selected assessor is not assigned to this module offering.' });
        }

        const updatedEnrollment = await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: {
                assignedAssessorId: assessorId,
            },
        });

        res.json(updatedEnrollment);
    } catch (error) {
        console.error('Error assigning assessor to student:', error);
        res.status(500).json({ error: 'An error occurred while assigning the assessor.' });
    }
};

const getOfferingStats = async (req, res) => {
  const { course_id, semester_id } = req.params;
  const { userId } = req.user;
  const { calculateFinalScore } = require('../lib/scoring');

  try {
    const lead = await prisma.assessor.findUnique({ where: { userId } });
    const isLead = await prisma.courseAssignment.findFirst({
      where: { courseId: course_id, assessorId: lead?.id, role: 'LEAD' }
    });

    if (!isLead && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: You are not a lead for this course.' });
    }

    const offerings = await prisma.offering.findMany({
      where: { semesterId: semester_id, module: { course_id: course_id } },
      include: { 
        module: { include: { competencies: true } },
        semester: true
      }
    });

    const results = await Promise.all(offerings.map(async (offering) => {
      const enrollments = await prisma.enrollment.findMany({
        where: { module_id: offering.moduleId, status: 'ACTIVE' },
        include: { student: { include: { user: true } } }
      });

      const studentData = await Promise.all(enrollments.map(async (e) => {
        const score = await calculateFinalScore(e.student.id, offering.moduleId);
        return {
          name: e.student.user.name,
          score: Math.round(score || 0),
          isPassed: (score || 0) >= 50
        };
      }));

      const avg = studentData.length > 0 ? studentData.reduce((a, b) => a + b.score, 0) / studentData.length : 0;

      return {
        moduleId: offering.moduleId,
        title: offering.module.title,
        moduleCode: offering.module.moduleCode,
        average: parseFloat(avg.toFixed(2)),
        studentCount: studentData.length,
        passRate: studentData.length > 0 
          ? parseFloat(((studentData.filter(s => s.isPassed).length / studentData.length) * 100).toFixed(2))
          : 0,
        students: studentData
      };
    }));

    res.json(results);
  } catch (error) {
    console.error('Error fetching offering stats:', error);
    res.status(500).json({ error: 'An error occurred while fetching offering statistics.' });
  }
};

module.exports = {
  createModule,
  publishModule,
  assignAssessorsToModule,
  unassignAssessor,
  getModulesForCourse,
  getAssessorsForCourse,
  getAllAssessors,
  getMyCourse,
  updateModule,
  deleteModule,
  migrateStudents,
  getCourseModules,
  getAllModules,
  updateCourseCredentialRule,
  getCourseById,
  getStudentsForCourse,
  importModules,
  assignAssessorToStudent,
  getOfferingStats,
};