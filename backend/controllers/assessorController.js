const prisma = require('../lib/prisma');
const { calculateFinalScore } = require('../lib/scoring');
const { issueCredential } = require('../lib/issuer');
const csv = require('csv-parser');
const stream = require('stream');

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

  try {
    const moduleAssignments = await prisma.moduleAssignment.findMany({
      where: {
        assessor: {
          userId: userId
        }
      },
      include: {
        module: true
      }
    });

    const modules = moduleAssignments.map(assignment => assignment.module);

    res.json(modules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching modules' });
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
            student_id: student.id,
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
                assessment: true,
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        const submissionsWithParsedData = submissions.map(submission => {
            let grade = null;
            try {
                grade = submission.grade ? JSON.parse(submission.grade) : null;
            } catch (e) {
                console.error('Error parsing grade JSON:', e);
            }

            return {
                ...submission,
                assessment: {
                    ...submission.assessment,
                    rubric: JSON.parse(submission.assessment.rubric),
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
                grade = submission.grade ? JSON.parse(submission.grade) : null;
            } catch (e) {
                console.error('Error parsing grade JSON:', e);
            }

            return {
                ...submission,
                assessment: {
                    ...submission.assessment,
                    rubric: JSON.parse(submission.assessment.rubric),
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
  const { title, submissionTypes, group, rubric, deadline, availableFrom, maxAttempts } = req.body;
  const { userId } = req.user;

  if (!title || !submissionTypes || !Array.isArray(submissionTypes) || submissionTypes.length === 0 || !deadline) {
    return res.status(400).json({ error: 'title, a non-empty array of submissionTypes, and deadline are required' });
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
        creator: { connect: { id: assessor.id } },
        title,
        submissionTypes,
        group,
        rubric,
        deadline: new Date(deadline),
        availableFrom: availableFrom ? new Date(availableFrom) : undefined,
        maxAttempts,
      },
    });
    res.status(201).json(assessment);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the assessment' });
  }
};

// @desc    Enroll a student in a module
// @route   POST /api/assessor/enroll-student
// @access  Private/Assessor
const enrollStudent = async (req, res) => {
  const { module_id, student_email } = req.body;
  const { userId } = req.user;


  if (!module_id || !student_email) {
    return res.status(400).json({ error: 'module_id and student_email are required' });
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

    const enrollment = await prisma.enrollment.create({
      data: {
        module: { connect: { module_id } },
        assessor: { connect: { id: assessor.id } },
        student: { connect: { id: student.id } },
      },
    });
    res.status(201).json(enrollment);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Enrollment already exists' });
    }
    res.status(500).json({ error: 'An error occurred while enrolling the student' });
  }
};

// @desc    Record an observation
// @route   POST /api/assessor/record-observation
// @access  Private/Assessor
const recordObservation = async (req, res) => {
  const { module_id, student_id, competencyTags, numericScore, maxScore, notes, media } = req.body;
  const { userId } = req.user;

  if (!module_id || !student_id) {
    return res.status(400).json({ error: 'module_id and student_id are required' });
  }

  if (numericScore && maxScore && numericScore > maxScore) {
    return res.status(400).json({ error: 'Numeric score cannot be greater than the maximum score.' });
  }

  try {
    const observation = await prisma.observation.create({
      data: {
        module: { connect: { module_id } },
        student: { connect: { id: student_id } },
        assessor: { connect: { userId: userId } },
        competencyTags,
        numericScore,
        maxScore,
        notes,
        media,
      },
    });
    res.status(201).json(observation);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while recording the observation' });
  }
};

// @desc    Grade a submission
// @route   POST /api/assessor/grade-submission/:submission_id
// @access  Private/Assessor
const gradeSubmission = async (req, res) => {
  const { submission_id } = req.params;
  const { grade: newGrade } = req.body;

  if (!newGrade || !newGrade.questionScores) {
    return res.status(400).json({ error: 'grade object with questionScores is required' });
  }

  try {
    const submission = await prisma.submission.findUnique({
      where: { submission_id },
      include: { 
        assessment: {
          include: {
            module: {
              include: {
                course: true,
              },
            },
          },
        },
        student: true 
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const rubric = JSON.parse(submission.assessment.rubric);

    // Validate new scores
    for (const qs of newGrade.questionScores) {
      const question = rubric.questions[qs.questionIndex];
      if (!question) {
        return res.status(400).json({ error: `Invalid question index: ${qs.questionIndex}` });
      }
      if (typeof qs.score !== 'number' || qs.score < 0) {
        return res.status(400).json({ error: `Invalid score for question ${qs.questionIndex + 1}` });
      }
      if (qs.score > Number(question.marks)) {
        return res.status(400).json({ error: `Score for question ${qs.questionIndex + 1} exceeds max marks of ${question.marks}` });
      }
    }

    const existingGrade = submission.grade ? JSON.parse(submission.grade) : { questionScores: [], notes: '' };

    const finalQuestionScoresMap = new Map();

    // Start with existing scores (from auto-grading)
    if (existingGrade && existingGrade.questionScores) {
      existingGrade.questionScores.forEach(qs => {
        finalQuestionScoresMap.set(qs.questionIndex, qs);
      });
    }

    // Overwrite with new scores from assessor
    newGrade.questionScores.forEach(qs => {
      finalQuestionScoresMap.set(qs.questionIndex, qs);
    });

    const finalQuestionScores = Array.from(finalQuestionScoresMap.values());
    const totalScore = finalQuestionScores.reduce((acc, qs) => acc + qs.score, 0);
    
    // An assessment is fully graded if there is a score for every question in the rubric
    const allQuestionsGraded = rubric.questions.every((question, index) => {
      return finalQuestionScores.some(s => s.questionIndex === index);
    });

    const finalGrade = {
      notes: newGrade.notes || existingGrade.notes,
      questionScores: finalQuestionScores,
      totalScore: totalScore,
    };

    console.log('Final Grade Object:', JSON.stringify(finalGrade, null, 2));

    const updatedSubmission = await prisma.submission.update({
      where: { submission_id },
      data: {
        grade: JSON.stringify(finalGrade),
        gradedAt: allQuestionsGraded ? new Date() : null,
      },
      include: {
        assessment: {
          include: {
            module: {
              include: {
                course: true,
              },
            },
          },
        },
        student: true
      },
    });

    if (allQuestionsGraded && updatedSubmission.assessment.group === 'SUMMATIVE') {
      const finalScore = await calculateFinalScore(updatedSubmission.student.id, updatedSubmission.assessment.module_id);
      const descriptor = getDescriptor(finalScore);
      const course = updatedSubmission.assessment.module.course;
      const minDescriptor = course.minDescriptor || 'ME';

      if (isPassing(descriptor, minDescriptor)) {
        await issueCredential(updatedSubmission.student.id, updatedSubmission.assessment.module_id, 'MICRO_CREDENTIAL', finalScore, descriptor);
      } else {
        await issueCredential(updatedSubmission.student.id, updatedSubmission.assessment.module_id, 'STATEMENT_OF_ATTAINMENT', finalScore, descriptor);
      }
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
      assessment: {
        module: {
          enrollments: {
            some: { assessor_id: assessor.id }
          }
        }
      },
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

const getDescriptor = (score) => {
  if (score >= 80) return 'EE';
  if (score >= 50) return 'ME';
  if (score >= 40) return 'AE';
  return 'BE';
};

const isPassing = (descriptor, minDescriptor) => {
  const descriptorRanks = { BE: 0, AE: 1, ME: 2, EE: 3 };
  return descriptorRanks[descriptor] >= descriptorRanks[minDescriptor];
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
        whereClause.createdBy = assessor.id;
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
  const { title, submissionTypes, group, rubric, deadline, availableFrom, maxAttempts } = req.body;
  const { userId, leadForCourseId } = req.user;

  if (deadline && isNaN(new Date(deadline).getTime())) {
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

    const assessmentToUpdate = await prisma.assessment.findUnique({
        where: { assessment_id: id },
        include: { submissions: true, module: true },
    });

    if (!assessmentToUpdate) {
        return res.status(404).json({ error: 'Assessment not found' });
    }

    const isCreator = assessmentToUpdate.createdBy === assessor.id;
    const isLead = leadForCourseId === assessmentToUpdate.module.course_id;

    if (!isCreator && !isLead) {
      return res.status(403).json({ error: 'You are not authorized to update this assessment' });
    }

    if (assessmentToUpdate.submissions.length > 0) {
        return res.status(400).json({ error: 'Cannot update an assessment with existing submissions' });
    }

    const assessment = await prisma.assessment.update({
      where: { assessment_id: id },
      data: {
        title,
        submissionTypes,
        group,
        rubric,
        deadline: deadline ? new Date(deadline) : undefined,
        availableFrom: availableFrom ? new Date(availableFrom) : undefined,
        maxAttempts,
      },
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

    const isCreator = assessmentToDelete.createdBy === assessor.id;
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
                await prisma.enrollment.create({
                  data: {
                    module: { connect: { module_id } },
                    assessor: { connect: { id: assessor.id } },
                    student: { connect: { id: student.id } },
                  },
                });
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

  try {
    await prisma.enrollment.delete({
      where: { id: enrollmentId },
    });
    res.json({ message: 'Student unenrolled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while unenrolling the student' });
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

    const submissionsToGrade = await prisma.submission.count({
      where: {
        gradedAt: null,
        assessment: {
          module: {
            enrollments: {
              some: { assessor_id: assessor.id }
            }
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

    const activeModules = await prisma.moduleAssignment.count({
      where: {
        assessorId: assessor.id,
        module: {
          status: 'PUBLISHED'
        }
      }
    });

    res.json({ submissionsToGrade, upcomingDeadlines, activeModules });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'An error occurred while fetching dashboard metrics' });
  }
};

module.exports = {
  getCourses,
  getModules,
  getCredentialTrackingData,
  getStudentProgressData,
  getSubmissionsForModule,
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
};