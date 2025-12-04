const prisma = require('../lib/prisma');
const { calculateFinalScore } = require('../lib/scoring');
const { checkAndIssueCredentials } = require('../lib/credentialHelpers');
const csv = require('csv-parser');
const stream = require('stream');
const { createNotification } = require('../lib/notifications');
const stringify = require('json-stable-stringify');

// @desc    Get all courses for an assessor
// @route   GET /api/assessor/courses
// @access  Private/Assessor
const getCourses = async (req, res) => {
  const { userId } = req.user;

  try {
    const courseAssignments = await prisma.courseAssignment.findMany({
      where: { 
        assessor: {
          userId: userId
        }
       },
      include: { course: true },
    });
    const courses = courseAssignments.map((assignment) => assignment.course);
    const uniqueCourses = [...new Map(courses.map(item => [item['course_id'], item])).values()];
    res.json(uniqueCourses);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching courses' });
  }
};

// @desc    Get all modules for an assessor
// @route   GET /api/assessor/modules
// @access  Private/Assessor
const getModules = async (req, res) => {
  const { userId } = req.user;
  const { tab = 'active', page = 1, courseId = 'all' } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = 10;
  const offset = (pageNum - 1) * limitNum;

  try {
    const assessor = await prisma.assessor.findUnique({
      where: { userId: userId },
    });

    if (!assessor) {
      return res.status(404).json({ error: 'Assessor profile not found' });
    }

    const where = {
      assessorId: assessor.id,
      offering: {
        module: {}
      }
    };

    if (courseId !== 'all') {
      where.offering.module.course_id = courseId;
    }

    if (tab === 'active') {
      where.offering.module.status = 'PUBLISHED';
    } else if (tab === 'completed') {
      where.offering.module.status = 'DEPRECATED';
    }

    const totalAssignments = await prisma.offeringAssignment.count({ where });

    const offeringAssignments = await prisma.offeringAssignment.findMany({
      where,
      skip: offset,
      take: limitNum,
      include: {
        offering: {
          include: {
            module: {
              include: {
                course: true,
              }
            }
          }
        }
      }
    });

    const modules = offeringAssignments.map(assignment => {
      return {
        ...assignment.offering.module,
        offeringId: assignment.offering.id,
      }
    });

    res.json({
      modules,
      totalPages: Math.ceil(totalAssignments / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching modules' });
  }
};

// @desc    Get all students for an assessor
// @route   GET /api/assessor/students
// @access  Private/Assessor
const getStudents = async (req, res) => {
  const { userId, leadForCourseId } = req.user;

  try {
    let students;
    
    if (leadForCourseId) {
      // Lead assessor: get all students in the course
      const modulesInCourse = await prisma.module.findMany({
        where: { course_id: leadForCourseId },
        select: { module_id: true },
      });
      const moduleIds = modulesInCourse.map(m => m.module_id);

      const enrollments = await prisma.enrollment.findMany({
        where: { module_id: { in: moduleIds } },
        include: {
          student: { include: { user: true } },
        },
      });
      students = enrollments.map(e => e.student);
    } else {
      // Regular assessor: get students from assigned modules
      const assessor = await prisma.assessor.findUnique({ where: { userId } });
      if (!assessor) {
        return res.status(404).json({ error: 'Assessor profile not found' });
      }
      const moduleAssignments = await prisma.moduleAssignment.findMany({
        where: { assessorId: assessor.id },
        select: { moduleId: true },
      });
      const moduleIds = moduleAssignments.map(m => m.moduleId);

      const enrollments = await prisma.enrollment.findMany({
        where: { 
          module_id: { in: moduleIds },
          assessor_id: assessor.id,
        },
        include: {
          student: { include: { user: true } },
        },
      });
      students = enrollments.map(e => e.student);
    }

    // Remove duplicate students and return only user data
    const uniqueStudents = [...new Map(students.map(item => [item['id'], item])).values()];
    const studentUsers = uniqueStudents.map(student => student.user);
    
    res.json(studentUsers);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'An error occurred while fetching students' });
  }
};

// @desc    Get credential tracking data
// @route   GET /api/assessor/credential-tracking
// @access  Private/Assessor
const getCredentialTrackingData = async (req, res) => {
  const { userId, leadForCourseId } = req.user;

  try {
    let students;

    if (leadForCourseId) {
      // Lead assessor: get all students in the course
      const modulesInCourse = await prisma.module.findMany({
        where: { course_id: leadForCourseId },
        select: { module_id: true },
      });
      const moduleIds = modulesInCourse.map(m => m.module_id);

      const enrollments = await prisma.enrollment.findMany({
        where: { module_id: { in: moduleIds } },
        include: {
          student: { include: { user: true } },
        },
      });
      students = enrollments.map(e => e.student);
    } else {
      // Regular assessor: get students from assigned modules
      const assessor = await prisma.assessor.findUnique({ where: { userId } });
      const moduleAssignments = await prisma.moduleAssignment.findMany({
        where: { assessorId: assessor.id },
        select: { moduleId: true },
      });
      const moduleIds = moduleAssignments.map(m => m.moduleId);

      const enrollments = await prisma.enrollment.findMany({
        where: { 
          module_id: { in: moduleIds },
          assessor_id: assessor.id,
        },
        include: {
          student: { include: { user: true } },
        },
      });
      students = enrollments.map(e => e.student);
    }

    // Remove duplicate students
    const uniqueStudents = [...new Map(students.map(item => [item['id'], item])).values()];

    // Now, for each student, get their credentials
    const studentCredentialData = await Promise.all(
      uniqueStudents.map(async (student) => {
        const microCredentials = await prisma.microCredential.findMany({
          where: { student_id: student.id },
          include: { module: true },
        });
        const courseCredentials = await prisma.courseCredential.findMany({
          where: { student_id: student.id },
          include: { course: true },
        });

        return {
          student: student.user,
          microCredentials,
          courseCredentials,
        };
      })
    );

    res.json(studentCredentialData);
  } catch (error) {
    console.error('Error fetching credential tracking data:', error);
    res.status(500).json({ error: 'An error occurred while fetching credential tracking data' });
  }
};

// @desc    Get student progress data
// @route   GET /api/assessor/student-progress
// @access  Private/Assessor
const getStudentProgressData = async (req, res) => {
  const { userId, leadForCourseId } = req.user;
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;

  try {
    let students;
    let moduleIds;

    if (leadForCourseId) {
      // Lead assessor: get all students in the course
      const modulesInCourse = await prisma.module.findMany({
        where: { course_id: leadForCourseId },
        select: { module_id: true },
      });
      moduleIds = modulesInCourse.map(m => m.module_id);

      const enrollments = await prisma.enrollment.findMany({
        where: { module_id: { in: moduleIds } },
        include: {
          student: { include: { user: true } },
        },
      });
      students = enrollments.map(e => e.student);
    } else {
      // Regular assessor: get students from assigned modules
      const assessor = await prisma.assessor.findUnique({ where: { userId } });
      const moduleAssignments = await prisma.moduleAssignment.findMany({
        where: { assessorId: assessor.id },
        select: { moduleId: true },
      });
      moduleIds = moduleAssignments.map(m => m.moduleId);

      const enrollments = await prisma.enrollment.findMany({
        where: {
          module_id: { in: moduleIds },
          assessor_id: assessor.id,
        },
        include: {
          student: { include: { user: true } },
        },
      });
      students = enrollments.map(e => e.student);
    }

    // Remove duplicate students
    const uniqueStudents = [...new Map(students.map(item => [item['id'], item])).values()];
    const totalStudents = uniqueStudents.length;
    const paginatedStudents = uniqueStudents.slice((page - 1) * pageSize, page * pageSize);


    // Now, for each student, get their progress data
    const studentProgressData = await Promise.all(
      paginatedStudents.map(async (student) => {
        const submissions = await prisma.submission.findMany({
          where: {
            student_id: student.id,
            assessment: {
              module_id: { in: moduleIds }
            }
          },
          include: { assessment: { include: { module: true } } },
        });

        const observations = await prisma.observation.findMany({
          where: {
            students: {
              some: {
                studentId: student.id,
              },
            },
            module_id: { in: moduleIds }
          },
          include: { module: true },
        });

        return {
          student: student.user,
          submissions,
          observations,
        };
      })
    );

    res.json({
      data: studentProgressData,
      totalPages: Math.ceil(totalStudents / pageSize),
    });
  } catch (error) {
    console.error('Error fetching student progress data:', error);
    res.status(500).json({ error: 'An error occurred while fetching student progress data' });
  }
};


// @desc    Get all submissions for a module
// @route   GET /api/assessor/modules/:moduleId/submissions
// @access  Private/Assessor
const getSubmissionsForModule = async (req, res) => {
    const { moduleId } = req.params;
    const { userId } = req.user;
    console.log(`Fetching submissions for module ${moduleId} for user ${userId}`);

    try {
        const assessor = await prisma.assessor.findUnique({ where: { userId: userId } });
        if (!assessor) {
            console.log('Assessor profile not found');
            return res.status(404).json({ error: 'Assessor profile not found' });
        }
        console.log('Found assessor:', assessor);

        const submissions = await prisma.submission.findMany({
            where: {
                assessment: {
                    module_id: moduleId,
                },
                student: {
                    enrollments: {
                        some: {
                            module_id: moduleId,
                            assessor_id: assessor.id,
                        },
                    },
                },
            },
            include: {
                student: { include: { user: true } },
                assessment: {
                    include: {
                        module: {
                            include: {
                                competencies: true,
                            }
                        }
                    }
                },
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        const submissionsWithParsedData = submissions.map(submission => {
            let grade = null;
            try {
                if (typeof submission.grade === 'string') {
                    grade = JSON.parse(submission.grade);
                } else {
                    grade = submission.grade; // It's already an object or null
                }
            } catch (e) {
                console.error('Error parsing grade JSON:', e);
                grade = submission.grade; // Fallback to original value
            }

            let rubric = null;
            try {
                if (typeof submission.assessment.rubric === 'string') {
                    rubric = JSON.parse(submission.assessment.rubric);
                } else {
                    rubric = submission.assessment.rubric;
                }
            } catch(e) {
                console.error('Error parsing rubric JSON:', e);
                rubric = submission.assessment.rubric; // Fallback
            }

            return {
                ...submission,
                assessment: {
                    ...submission.assessment,
                    rubric: rubric,
                },
                grade,
            };
        });

        console.log('Found submissions:', submissionsWithParsedData);
        res.json(submissionsWithParsedData);
    } catch (error) {
        console.error('Error fetching submissions for module:', error);
        res.status(500).json({ error: 'An error occurred while fetching submissions' });
    }
};

const getOfferingByModule = async (req, res) => {
  const { moduleId } = req.params;

  try {
    const module = await prisma.module.findUnique({
      where: { module_id: moduleId },
      include: {
        course: true,
        moduleAssignments: {
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

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json(module);
  } catch (error) {
    console.error(`Error fetching offering for module ${moduleId}:`, error);
    res.status(500).json({ error: 'An error occurred while fetching the module offering' });
  }
};

// @desc    Get all submissions for an assessment
// @route   GET /api/assessor/submissions
// @access  Private/Assessor
const getSubmissionsForAssessment = async (req, res) => {
    const { assessment_id } = req.query;
    const { userId } = req.user;

    try {
        const assessor = await prisma.assessor.findUnique({ where: { userId: userId } });
        if (!assessor) {
            return res.status(404).json({ error: 'Assessor profile not found' });
        }

        const submissions = await prisma.submission.findMany({
            where: {
                assessment_id: assessment_id,
            },
            include: {
                student: { include: { user: true } },
                assessment: true,
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        const submissionsWithParsedData = submissions.map(submission => {
            let grade = null;
            try {
                if (typeof submission.grade === 'string') {
                    grade = JSON.parse(submission.grade);
                } else {
                    grade = submission.grade; // It's already an object or null
                }
            } catch (e) {
                console.error('Error parsing grade JSON:', e);
                grade = submission.grade; // Fallback to original value
            }

            let rubric = null;
            try {
                if (typeof submission.assessment.rubric === 'string') {
                    rubric = JSON.parse(submission.assessment.rubric);
                } else {
                    rubric = submission.assessment.rubric;
                }
            } catch(e) {
                console.error('Error parsing rubric JSON:', e);
                rubric = submission.assessment.rubric; // Fallback
            }

            return {
                ...submission,
                assessment: {
                    ...submission.assessment,
                    rubric: rubric,
                },
                grade,
            };
        });

        res.json(submissionsWithParsedData);
    } catch (error) {
        console.error('Error fetching submissions for assessment:', error);
        res.status(500).json({ error: 'An error occurred while fetching submissions' });
    }
};

// @desc    Create a new assessment
// @route   POST /api/assessor/create-assessment/:module_id
// @access  Private/Assessor
const createAssessment = async (req, res) => {
  const { module_id } = req.params;
  const { title, description, submissionTypes, group, rubric, deadline, availableFrom, maxAttempts, duration, isFinal } = req.body;
  const { userId } = req.user;

  if (!title || !submissionTypes || !Array.isArray(submissionTypes) || submissionTypes.length === 0 || !deadline) {
    return res.status(400).json({ error: 'title, a non-empty array of submissionTypes, and deadline are required' });
  }
  
  if (group === 'SUMMATIVE' && typeof isFinal !== 'boolean') {
    return res.status(400).json({ error: 'For summative assessments, a finality choice is required.' });
  }

  if (isNaN(new Date(deadline).getTime())) {
    return res.status(400).json({ error: 'Invalid deadline date' });
  }

  if (availableFrom && isNaN(new Date(availableFrom).getTime())) {
    return res.status(400).json({ error: 'Invalid availableFrom date' });
  }

  try {
    const assessor = await prisma.assessor.findUnique({ where: { userId } });
    if (!assessor) {
      return res.status(404).json({ error: 'Assessor profile not found' });
    }

    const assessment = await prisma.assessment.create({
      data: {
        module: { connect: { module_id } },
        createdByAssessor: { connect: { id: assessor.id } },
        title,
        description,
        submissionTypes,
        group,
        rubric,
        deadline: new Date(deadline),
        availableFrom: availableFrom ? new Date(availableFrom) : undefined,
        maxAttempts,
        duration,
        isFinal: group === 'SUMMATIVE' ? isFinal : false,
      },
    });

    // Notify students enrolled in the module AND assigned to this assessor
    const enrollments = await prisma.enrollment.findMany({
      where: {
        module_id,
        assessor_id: assessor.id, // Filter by the assessor who created the assessment
      },
      include: { student: { include: { user: true } } },
    });

    for (const enrollment of enrollments) {
      await createNotification(
        enrollment.student.user.user_id,
        `A new assessment "${title}" has been created for your module.`
      );
    }
    res.status(201).json(assessment);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the assessment' });
  }
};

// @desc    Enroll a student in a module
// @route   POST /api/assessor/enroll-student
// @access  Private/Assessor
const enrollStudent = async (req, res) => {
  const { offeringId, student_email } = req.body;
  const { userId } = req.user;


  if (!offeringId || !student_email) {
    return res.status(400).json({ error: 'offeringId and student_email are required' });
  }

  try {
    const studentUser = await prisma.user.findUnique({ where: { email: student_email } });
    if (!studentUser) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = await prisma.student.findUnique({ where: { userId: studentUser.user_id } });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const assessor = await prisma.assessor.findUnique({ where: { userId: userId } });
    if (!assessor) {
      return res.status(404).json({ error: 'Assessor profile not found' });
    }
    
    // Check if the assessor is assigned to this offering
    const offeringAssignment = await prisma.offeringAssignment.findFirst({
        where: {
            offeringId: offeringId,
            assessorId: assessor.id,
        }
    });

    if (!offeringAssignment) {
        return res.status(403).json({ error: 'You are not assigned to this module offering.' });
    }

    const offering = await prisma.offering.findUnique({
        where: { id: offeringId }
    });
    if (!offering) {
        return res.status(404).json({ error: 'Offering not found' });
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
            module_id_student_id: {
                module_id: offering.moduleId,
                student_id: student.id,
            }
        }
    });

    if (existingEnrollment) {
        if (existingEnrollment.status === 'INACTIVE') {
            const enrollment = await prisma.enrollment.update({
                where: { id: existingEnrollment.id },
                data: { status: 'ACTIVE', assessor_id: assessor.id },
            });
            return res.status(200).json({ message: 'Student re-enrolled successfully.', enrollment });
        } else {
            return res.status(400).json({ error: 'Student is already enrolled in this offering.' });
        }
    } else {
        const enrollment = await prisma.enrollment.create({
            data: {
                module: { connect: { module_id: offering.moduleId } },
                student: { connect: { id: student.id } },
                assessor: { connect: { id: assessor.id } },
            },
        });
        return res.status(201).json(enrollment);
    }
  } catch (error) {
    console.error("Error enrolling student:", error);
    res.status(500).json({ error: 'An error occurred while enrolling the student.' });
  }
};

// @desc    Record an observation
// @route   POST /api/assessor/record-observation
// @access  Private/Assessor
const recordObservation = async (req, res) => {
  const { module_id, studentIds, competencyIds, numericScore, maxScore, notes, media, group, isFinal } = req.body;
  const { userId } = req.user;

  if (!module_id || !studentIds || studentIds.length === 0) {
    return res.status(400).json({ error: 'module_id and at least one studentId are required' });
  }

  if (numericScore && maxScore && numericScore > maxScore) {
    return res.status(400).json({ error: 'Numeric score cannot be greater than the maximum score.' });
  }

  try {
    const assessor = await prisma.assessor.findUnique({ where: { userId } });
    if (!assessor) {
      return res.status(404).json({ error: 'Assessor profile not found' });
    }

    const observation = await prisma.observation.create({
      data: {
        module: { connect: { module_id } },
        assessor: { connect: { id: assessor.id } },
        numericScore,
        maxScore,
        notes,
        media,
        group,
        isFinal: group === 'SUMMATIVE' ? isFinal : false,
        students: {
          createMany: {
            data: studentIds.map(sId => ({
              studentId: sId,
              assignedBy: userId,
            })),
          },
        },
      },
      include: {
        module: {
            include: {
                course: true
            }
        },
        students: {
            include: {
                student: true
            }
        }
      }
    });

    if (competencyIds && competencyIds.length > 0) {
      for (const studentId of studentIds) {
        await prisma.studentCompetencyEvidence.createMany({
          data: competencyIds.map(cId => ({
            studentId: studentId,
            competencyId: cId,
            moduleId: module_id,
            observationId: observation.id,
            status: 'SUCCESS',
          })),
          skipDuplicates: true,
        });
        if (group === 'SUMMATIVE') {
          await checkAndIssueCredentials(studentId, module_id, isFinal || false);
        }
      }
    }

    res.status(201).json(observation);
  } catch (error) {
    console.error('Error recording observation:', error);
    res.status(500).json({ error: 'An error occurred while recording the observation' });
  }
};

// @desc    Grade a submission
// @route   POST /api/assessor/grade-submission/:submission_id
// @access  Private/Assessor
const gradeSubmission = async (req, res) => {
  const { submission_id } = req.params;
  const { grade, shouldFinalizeCredential } = req.body;

  if (typeof shouldFinalizeCredential !== 'boolean') {
    return res.status(400).json({ error: 'A finality choice (shouldFinalizeCredential) is required.' });
  }

  try {
    const submission = await prisma.submission.findUnique({
      where: { submission_id },
      include: {
        assessment: { include: { module: { include: { course: true } } } },
        student: true,
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Only check for ungraded formative assessments if the current one is SUMMATIVE
    if (submission.assessment.group === 'SUMMATIVE') {
      const ungradedFormativeSubmissions = await prisma.submission.findMany({
        where: {
          student_id: submission.student_id,
          assessment: {
            module_id: submission.assessment.module_id,
            group: 'FORMATIVE',
          },
          gradedAt: null,
          NOT: {
            submission_id: submission.submission_id,
          },
        },
        include: {
          assessment: {
            select: {
              title: true,
            },
          },
        },
      });

      if (ungradedFormativeSubmissions.length > 0) {
        const submissionTitles = ungradedFormativeSubmissions.map(s => `"${s.assessment.title}"`).join(', ');
        return res.status(400).json({
          error: `Please grade all formative assessments for this student first. The following submissions are pending: ${submissionTitles}.`,
        });
      }
    }

    if (grade.competencyEvidence) {
      const evidenceToCreate = [];
      for (const qIndex in grade.competencyEvidence) {
        for (const cId in grade.competencyEvidence[qIndex]) {
          if (grade.competencyEvidence[qIndex][cId]) {
            evidenceToCreate.push({
              studentId: submission.student_id,
              competencyId: cId,
              moduleId: submission.assessment.module_id,
              assessmentId: submission.assessment_id,
              status: 'SUCCESS',
            });
          }
        }
      }
      if (evidenceToCreate.length > 0) {
        await prisma.studentCompetencyEvidence.createMany({
          data: evidenceToCreate,
          skipDuplicates: true,
        });
      }
    }

    const updatedSubmission = await prisma.submission.update({
      where: { submission_id },
      data: {
        grade,
        gradedAt: new Date(),
      },
      include: {
        assessment: true,
        student: { include: { user: true } },
      },
    });

    // Notify the student about the graded submission
    await createNotification(
      updatedSubmission.student.user.user_id,
      `Your submission for "${updatedSubmission.assessment.title}" has been graded.`
    );

    if (updatedSubmission.assessment.group === 'SUMMATIVE') {
      await checkAndIssueCredentials(updatedSubmission.student.id, updatedSubmission.assessment.module_id, shouldFinalizeCredential);
    }

    res.json(updatedSubmission);
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ error: 'An error occurred while grading the submission' });
  }
};

const getRandomSubmission = async (req, res) => {
  const { userId } = req.user;

  try {
    const assessor = await prisma.assessor.findUnique({ where: { userId: userId } });
    if (!assessor) {
      return res.status(404).json({ error: 'Assessor profile not found' });
    }

    const ungradedSubmissions = await prisma.submission.findMany({
      where: {
        assessment: {
          module: {
            enrollments: {
              some: { assessor_id: assessor.id }
            }
          }
        },
        gradedAt: null,
      },
    });

    if (ungradedSubmissions.length === 0) {
      return res.status(404).json({ error: 'No ungraded submissions found' });
    }

    const randomSubmission = ungradedSubmissions[Math.floor(Math.random() * ungradedSubmissions.length)];
    res.json(randomSubmission);
  } catch (error) {
    console.error('Error fetching random submission:', error);
    res.status(500).json({ error: 'An error occurred while fetching a random submission' });
  }
};

const getRecentActivity = async (req, res) => {
  const { userId } = req.user;

  const assessor = await prisma.assessor.findUnique({ where: { userId: userId } });
  if (!assessor) {
    return res.status(404).json({ error: 'Assessor profile not found' });
  }

  const recentSubmissions = await prisma.submission.findMany({
    where: {
      student: {
        enrollments: {
          some: { assessor_id: assessor.id }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      student: { include: { user: true } },
      assessment: true,
    },
  });

  const formattedSubmissions = recentSubmissions.map(s => ({
    id: s.submission_id,
    type: 'submission',
    student: s.student.user.name,
    assessment: s.assessment.title,
    time: s.createdAt,
  }));

  res.json(formattedSubmissions);
};

// @desc    Get all assessments for a module
// @route   GET /api/assessor/modules/:module_id/assessments
// @access  Private/Assessor
const getAssessmentsForModule = async (req, res) => {
  const { module_id } = req.params;
  const { userId, leadForCourseId } = req.user;

  try {
    const module = await prisma.module.findUnique({ where: { module_id } });
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    let whereClause = { module_id: module_id };

    if (leadForCourseId !== module.course_id) {
      const assessor = await prisma.assessor.findUnique({ where: { userId } });
      if (assessor) {
        whereClause.createdByAssessorId = assessor.id;
      }
    }

    const assessments = await prisma.assessment.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching assessments' });
  }
};

// @desc    Get a single assessment by ID
// @route   GET /api/assessor/assessments/:id
// @access  Private/Assessor
const getAssessmentById = async (req, res) => {
  const { id } = req.params;

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { assessment_id: id },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the assessment' });
  }
};

// @desc    Update an assessment
// @route   PUT /api/assessor/assessments/:id
// @access  Private/Assessor
const updateAssessment = async (req, res) => {
  const { id } = req.params;
  const { title, description, submissionTypes, group, rubric, deadline, availableFrom, maxAttempts, duration, isFinal } = req.body;
  const { userId, leadForCourseId } = req.user;

  console.log('Request Body:', req.body);

  try {
    const assessor = await prisma.assessor.findUnique({ where: { userId } });
    if (!assessor) {
      return res.status(404).json({ error: 'Assessor profile not found' });
    }

    const assessmentToUpdate = await prisma.assessment.findUnique({
        where: { assessment_id: id },
        include: { submissions: true, module: true },
    });

    if (!assessmentToUpdate) {
        return res.status(404).json({ error: 'Assessment not found' });
    }

    const isCreator = assessmentToUpdate.createdByAssessorId === assessor.id;
    const isLead = leadForCourseId === assessmentToUpdate.module.course_id;

    if (!isCreator && !isLead) {
      return res.status(403).json({ error: 'You are not authorized to update this assessment' });
    }

    if (assessmentToUpdate.submissions.length > 0) {
      const allowedUpdates = ['deadline', 'duration'];
      const requestedUpdates = Object.keys(req.body);

      const disallowedFields = requestedUpdates.filter(key => 
        !allowedUpdates.includes(key) && req.body[key] !== undefined
      );
      
const stringify = require('json-stable-stringify');

// inside updateAssessment's actuallyChangedDisallowedFields filter
      const actuallyChangedDisallowedFields = disallowedFields.filter(key => {
        const oldValue = assessmentToUpdate[key];
        const newValue = req.body[key];
        
        if (oldValue instanceof Date) {
          if (oldValue === null && newValue === null) return false;
          if (oldValue === null || newValue === null) return true;
          return new Date(newValue).getTime() !== oldValue.getTime();
        }

        if (typeof oldValue === 'object' && oldValue !== null) {
          return stringify(oldValue) !== stringify(newValue);
        }

        if (oldValue === null && typeof newValue === 'object' && newValue !== null) {
          // if old value is null and new value is an empty object, consider it unchanged
          return Object.keys(newValue).length > 0;
        }

        return oldValue !== newValue;
      });

      if (actuallyChangedDisallowedFields.length > 0) {
        return res.status(400).json({ 
          error: `Cannot update fields (${actuallyChangedDisallowedFields.join(', ')}) on an assessment with existing submissions. Only deadline and duration are editable.` 
        });
      }
    }

    const dataToUpdate = {};

    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (submissionTypes !== undefined) dataToUpdate.submissionTypes = submissionTypes;
    if (group !== undefined) dataToUpdate.group = group;
    if (rubric !== undefined) dataToUpdate.rubric = rubric;
    if (maxAttempts !== undefined) dataToUpdate.maxAttempts = maxAttempts;
    if (duration !== undefined) dataToUpdate.duration = duration;

    if (deadline !== undefined) {
      if (deadline === null) {
        dataToUpdate.deadline = null;
      } else {
        if (isNaN(new Date(deadline).getTime())) return res.status(400).json({ error: 'Invalid deadline date' });
        dataToUpdate.deadline = new Date(deadline);
      }
    }
    
    if (availableFrom !== undefined) {
      if (availableFrom === null) {
        dataToUpdate.availableFrom = null;
      } else {
        if (isNaN(new Date(availableFrom).getTime())) return res.status(400).json({ error: 'Invalid availableFrom date' });
        dataToUpdate.availableFrom = new Date(availableFrom);
      }
    }

    const effectiveGroup = dataToUpdate.group || assessmentToUpdate.group;

    if (effectiveGroup === 'SUMMATIVE') {
        if (typeof isFinal === 'boolean') {
            dataToUpdate.isFinal = isFinal;
        } else if (group !== undefined && group === 'SUMMATIVE') {
            // group is being explicitly set to SUMMATIVE, and isFinal is not provided
            return res.status(400).json({ error: 'For summative assessments, a finality choice is required.' });
        }
        // if group is not being changed, and isFinal is not provided, we just keep the old value
        // by not adding it to dataToUpdate.
    } else if (group !== undefined && effectiveGroup !== 'SUMMATIVE') {
        dataToUpdate.isFinal = false;
    }


    const assessment = await prisma.assessment.update({
      where: { assessment_id: id },
      data: dataToUpdate,
    });
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the assessment' });
  }
};

// @desc    Delete an assessment
// @route   DELETE /api/assessor/assessments/:id
// @access  Private/Assessor
const deleteAssessment = async (req, res) => {
  const { id } = req.params;
  const { userId, leadForCourseId } = req.user;

  try {
    const assessor = await prisma.assessor.findUnique({ where: { userId } });
    if (!assessor) {
      return res.status(404).json({ error: 'Assessor profile not found' });
    }

    const assessmentToDelete = await prisma.assessment.findUnique({
        where: { assessment_id: id },
        include: { submissions: true, module: true },
    });

    if (!assessmentToDelete) {
        return res.status(404).json({ error: 'Assessment not found' });
    }

    const isCreator = assessmentToDelete.createdByAssessorId === assessor.id;
    const isLead = leadForCourseId === assessmentToDelete.module.course_id;

    if (!isCreator && !isLead) {
      return res.status(403).json({ error: 'You are not authorized to delete this assessment' });
    }

    if (assessmentToDelete.submissions.length > 0) {
        return res.status(400).json({ error: 'Cannot delete an assessment with existing submissions' });
    }

    await prisma.assessment.delete({
      where: { assessment_id: id },
    });
    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the assessment' });
  }
};

// @desc    Bulk enroll students from a CSV file
// @route   POST /api/assessor/bulk-enroll
// @access  Private/Assessor
const bulkEnroll = async (req, res) => {
  const { module_id } = req.body;
  const { userId } = req.user;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const assessor = await prisma.assessor.findUnique({ where: { userId: userId } });
  if (!assessor) {
    return res.status(404).json({ error: 'Assessor profile not found' });
  }

  const results = [];
  const errors = [];

  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.file.buffer);

  bufferStream
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      for (const row of results) {
        const student_email = row.email;
        if (student_email) {
          try {
            const studentUser = await prisma.user.findUnique({ where: { email: student_email } });
            if (studentUser) {
              const student = await prisma.student.findUnique({ where: { userId: studentUser.user_id } });
              if (student) {
                const existingEnrollment = await prisma.enrollment.findUnique({
                  where: {
                    module_id_student_id: {
                      module_id: module_id,
                      student_id: student.id,
                    }
                  }
                });

                if (existingEnrollment) {
                  if (existingEnrollment.status === 'INACTIVE') {
                    await prisma.enrollment.update({
                      where: { id: existingEnrollment.id },
                      data: { status: 'ACTIVE', assessor_id: assessor.id },
                    });
                  }
                } else {
                  await prisma.enrollment.create({
                    data: {
                      module: { connect: { module_id } },
                      assessor: { connect: { id: assessor.id } },
                      student: { connect: { id: student.id } },
                    },
                  });
                }
              } else {
                errors.push(`Student profile not found for email: ${student_email}`);
              }
            } else {
              errors.push(`Student not found for email: ${student_email}`);
            }
          } catch (error) {
            if (error.code !== 'P2002') {
              errors.push(`Error enrolling ${student_email}: ${error.message}`);
            }
          }
        }
      }
      res.json({ message: 'Bulk enrollment processed.', errors });
    });
};

// @desc    Unenroll a student
// @route   DELETE /api/assessor/enrollments/:enrollmentId
// @access  Private/Assessor
const unenrollStudent = async (req, res) => {
  const { enrollmentId } = req.params;
  const { userId, role } = req.user;

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { 
        module: { 
          include: { 
            course: true 
          } 
        } 
      },
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const assessor = await prisma.assessor.findUnique({ where: { userId } });
    if (!assessor) {
      return res.status(404).json({ error: 'Assessor profile not found.' });
    }

    const isCourseLead = await prisma.courseAssignment.findFirst({
      where: {
        courseId: enrollment.module.course_id,
        assessorId: assessor.id,
        role: 'LEAD',
      },
    });

    // An admin, the course lead, or the assessor assigned to the enrollment can unenroll.
    if (role !== 'ADMIN' && !isCourseLead && enrollment.assessor_id !== assessor.id) {
      return res.status(403).json({ error: 'You are not authorized to unenroll this student.' });
    }

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'INACTIVE' },
    });

    res.json({ message: 'Student unenrolled successfully. The enrollment is now inactive.' });
  } catch (error) {
    console.error('Error unenrolling student:', error);
    res.status(500).json({ error: 'An error occurred while unenrolling the student.' });
  }
};

// @desc    Get a pre-signed URL for a submission media file
// @route   GET /api/assessor/submissions/:submission_id/media/:question_index/url
// @access  Private/Assessor
const getSubmissionMediaUrl = async (req, res) => {
  const { submission_id, question_index } = req.params;

  try {
    const submission = await prisma.submission.findUnique({
      where: { submission_id },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const answer = submission.data.answers[question_index];

    if (!answer || !answer.url) {
      return res.status(404).json({ error: 'Media file not found for this answer' });
    }

    res.json({ url: answer.url });
  } catch (error) {
    console.error('Error getting media URL:', error);
  }
};

const getDashboardMetrics = async (req, res) => {
  const { userId } = req.user;

  try {
    const assessor = await prisma.assessor.findUnique({ where: { userId: userId } });
    if (!assessor) {
      return res.status(404).json({ error: 'Assessor profile not found' });
    }

    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));

    const submissionsToGrade = await prisma.submission.count({
      where: {
        gradedAt: null,
        student: {
          enrollments: {
            some: { assessor_id: assessor.id }
          }
        }
      }
    });

    const submissionsGradedLast30Days = await prisma.submission.count({
      where: {
        gradedAt: {
          gte: thirtyDaysAgo,
        },
        student: {
          enrollments: {
            some: { assessor_id: assessor.id }
          }
        }
      }
    });

    const upcomingDeadlines = await prisma.assessment.count({
      where: {
        deadline: { gte: new Date() },
        module: {
          enrollments: {
            some: { assessor_id: assessor.id }
          }
        }
      }
    });

    const activeModulesCount = await prisma.offeringAssignment.count({
      where: {
        assessorId: assessor.id,
        offering: {
          module: {
            status: 'PUBLISHED'
          }
        }
      }
    });

    res.json({ submissionsToGrade, submissionsGradedLast30Days, upcomingDeadlines, activeModules: activeModulesCount });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'An error occurred while fetching dashboard metrics' });
  }
};

// @desc    Get all observations for a module
// @route   GET /api/assessor/modules/:moduleId/observations
// @access  Private/Assessor
const getObservationsForModule = async (req, res) => {
    const { moduleId } = req.params;
    const { userId } = req.user;

    try {
        const assessor = await prisma.assessor.findUnique({ where: { userId: userId } });
        if (!assessor) {
            return res.status(404).json({ error: 'Assessor profile not found' });
        }

        const observations = await prisma.observation.findMany({
            where: {
                module_id: moduleId,
                assessor_id: assessor.id,
            },
            include: {
                students: { // Include the StudentsOnObservations join table
                    include: {
                        student: { // Include the actual Student model
                            include: {
                                user: true // Include the User model for the student
                            }
                        }
                    }
                },
                assessor: { include: { user: true } },
                module: {
                    include: {
                        competencies: true,
                    }
                },
                studentCompetencyEvidence: {
                    include: {
                        competency: true
                    }
                }
            },
            orderBy: {
                recordedAt: 'desc',
            }
        });

        res.json(observations);
    } catch (error) {
        console.error('Error fetching observations for module:', error);
        res.status(500).json({ error: 'An error occurred while fetching observations' });
    }
};

// @desc    Update an observation
// @route   PUT /api/assessor/observations/:observationId
// @access  Private/Assessor
const updateObservation = async (req, res) => {
  const { observationId } = req.params;
  const { studentIds, competencyIds, numericScore, notes, group, isFinal } = req.body;
  const { userId } = req.user;

  try {
    const assessor = await prisma.assessor.findUnique({ where: { userId } });
    if (!assessor) {
      return res.status(404).json({ error: 'Assessor profile not found' });
    }

    const observation = await prisma.observation.findUnique({
      where: { id: observationId },
      include: { students: true, module: true },
    });

    if (!observation) {
      return res.status(404).json({ error: 'Observation not found' });
    }

    if (observation.assessor_id !== assessor.id) {
      return res.status(403).json({ error: 'You are not authorized to update this observation' });
    }

    // Begin a transaction to ensure atomicity
    const transactionOperations = [];

    // --- 1. Update Students ---
    const existingStudentIds = observation.students.map(s => s.studentId);
    const studentsToConnect = (studentIds || []).filter(sId => !existingStudentIds.includes(sId));
    const studentsToDisconnect = existingStudentIds.filter(sId => !(studentIds || []).includes(sId));

    if (studentsToDisconnect.length > 0) {
      // Also remove their competency evidence for this observation
      transactionOperations.push(prisma.studentCompetencyEvidence.deleteMany({
        where: {
          observationId: observationId,
          studentId: { in: studentsToDisconnect },
        },
      }));
      transactionOperations.push(prisma.studentsOnObservations.deleteMany({
        where: {
          observationId: observationId,
          studentId: { in: studentsToDisconnect },
        },
      }));
    }

    if (studentsToConnect.length > 0) {
      transactionOperations.push(prisma.studentsOnObservations.createMany({
        data: studentsToConnect.map(sId => ({
          studentId: sId,
          observationId: observationId,
          assignedBy: userId,
        })),
        skipDuplicates: true,
      }));
    }

    // --- 2. Update Competencies for remaining and new students ---
    const finalStudentIds = (studentIds || existingStudentIds);

    // First, clear all existing competency evidence for this observation
    transactionOperations.push(prisma.studentCompetencyEvidence.deleteMany({
      where: { observationId: observationId },
    }));

    // Then, create the new evidence for all relevant students
    if (finalStudentIds.length > 0 && competencyIds && competencyIds.length > 0) {
      const newEvidence = finalStudentIds.flatMap(studentId =>
        competencyIds.map(cId => ({
          studentId: studentId,
          competencyId: cId,
          moduleId: observation.module_id,
          observationId: observationId,
          status: 'SUCCESS',
        }))
      );
      transactionOperations.push(prisma.studentCompetencyEvidence.createMany({
        data: newEvidence,
        skipDuplicates: true,
      }));
    }

    // --- 3. Update Observation Details ---
    transactionOperations.push(prisma.observation.update({
      where: { id: observationId },
      data: {
        numericScore,
        notes,
        group,
        isFinal: group === 'SUMMATIVE' ? isFinal : false,
      },
    }));

    // Execute all operations in a single transaction
    await prisma.$transaction(transactionOperations);

    // --- 4. Post-update: Re-check credentials ---
    if (group === 'SUMMATIVE') {
      for (const studentId of finalStudentIds) {
        await checkAndIssueCredentials(studentId, observation.module_id, isFinal || false);
      }
    }
    
    const updatedObservation = await prisma.observation.findUnique({
      where: { id: observationId },
      include: {
        students: { include: { student: { include: { user: true } } } },
        assessor: { include: { user: true } },
        module: { include: { competencies: true, course: true } },
        studentCompetencyEvidence: { include: { competency: true } }
      }
    })

    res.json(updatedObservation);
  } catch (error) {
    console.error('Error updating observation:', error);
    res.status(500).json({ error: 'An error occurred while updating the observation' });
  }
};

module.exports = {
  getCourses,
  getModules,
  getStudents,
  getCredentialTrackingData,
  getStudentProgressData,
  getSubmissionsForModule,
  getOfferingByModule,
  getSubmissionsForAssessment,
  createAssessment,
  enrollStudent,
  recordObservation,
  gradeSubmission,
  getRandomSubmission,
  getRecentActivity,
  getAssessmentsForModule,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  bulkEnroll,
  unenrollStudent,
  getSubmissionMediaUrl,
  getDashboardMetrics,
  getObservationsForModule,
  updateObservation,
};