const prisma = require('../lib/prisma');
const cloudinary = require('cloudinary').v2;
const scoring = require('../lib/scoring');

const getStudentId = async (userId) => {
    const student = await prisma.student.findUnique({
        where: { userId },
        select: { id: true },
    });
    return student ? student.id : null;
};

const getUpcomingAssessments = async (req, res) => {
  const { userId } = req.user;
  const studentId = await getStudentId(userId);
  if (!studentId) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: studentId },
      select: { module_id: true, assessor_id: true },
    });

    if (enrollments.length === 0) {
      return res.json([]);
    }

    const whereClauses = enrollments
      .filter(e => e.assessor_id)
      .map(e => ({
        module_id: e.module_id,
        createdByAssessorId: e.assessor_id,
      }));

    if (whereClauses.length === 0) {
      return res.json([]);
    }

    const upcoming = await prisma.assessment.findMany({
      where: {
        AND: [
          { OR: whereClauses },
          {
            deadline: { gte: new Date() },
            submissions: {
              none: { student_id: studentId },
            },
          },
        ]
      },
      include: {
        module: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        deadline: 'asc',
      },
      take: 4,
    });
    res.json(upcoming);
  } catch (error) {
    console.error('Error fetching upcoming assessments:', error);
    res.status(500).json({ error: 'An error occurred while fetching upcoming assessments' });
  }
};

const getDashboard = async (req, res) => {
  const { userId } = req.user;
  const studentId = await getStudentId(userId);
  if (!studentId) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  try {
    const unreadNotificationsCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    const microCredentialsCount = await prisma.microCredential.count({
        where: { student_id: studentId },
    });

    const courseCredentialsCount = await prisma.courseCredential.count({
        where: { student_id: studentId },
    });

    const credentialsEarned = microCredentialsCount + courseCredentialsCount;

    const allEnrollments = await prisma.enrollment.findMany({
        where: { student_id: studentId, status: 'ACTIVE' },
        select: { module_id: true },
    });

    const earnedMicroCredentials = await prisma.microCredential.findMany({
        where: { student_id: studentId },
        select: { module_id: true },
    });

    const earnedModuleIds = new Set(earnedMicroCredentials.map((c) => c.module_id));

    const activeModulesEnrolled = allEnrollments.filter(
        (e) => !earnedModuleIds.has(e.module_id)
    ).length;

    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: studentId },
      select: { assessor_id: true, module_id: true },
    });

    const whereClauses = enrollments
      .filter((e) => e.assessor_id)
      .map((e) => ({
        module_id: e.module_id,
        createdByAssessorId: e.assessor_id,
      }));

    const pendingAssessmentsCount =
      whereClauses.length > 0
        ? await prisma.assessment.count({
            where: {
              OR: whereClauses,
              submissions: { none: { student_id: studentId } },
            },
          })
        : 0;

    res.json({
      unreadNotificationsCount,
      credentialsEarned,
      activeModulesEnrolled,
      pendingAssessmentsCount,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'An error occurred while fetching dashboard data' });
  }
};

const getWallet = async (req, res) => {
  const { userId } = req.user;
  const studentId = await getStudentId(userId);
  if (!studentId) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  try {
    const microCredentials = await prisma.microCredential.findMany({
      where: { student_id: studentId },
      include: {
        student: {
          include: {
            user: true, // Include the User model for student's name, email, regNumber
          },
        },
        module: {
          include: {
            course: true, // Include the Course model for course details if needed
          },
        },
      },
    });
    const courseCredentials = await prisma.courseCredential.findMany({
      where: { student_id: studentId },
      include: {
        student: {
          include: {
            user: true, // Include the User model for student's name, email, regNumber
          },
        },
        course: true, // Include the Course model for course details
      },
    });
    res.json({ microCredentials, courseCredentials });
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    res.status(500).json({ error: 'An error occurred while fetching wallet data' });
  }
};

const getAssessments = async (req, res) => {
  const { userId } = req.user;
  const studentId = await getStudentId(userId);
  if (!studentId) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: studentId },
      select: { module_id: true, assessor_id: true },
    });

    if (enrollments.length === 0) {
      return res.json([]);
    }
    
    const whereClauses = enrollments
      .filter(e => e.assessor_id)
      .map(e => ({
        module_id: e.module_id,
        createdByAssessorId: e.assessor_id,
      }));

    if (whereClauses.length === 0) {
      return res.json([]);
    }

    const assessments = await prisma.assessment.findMany({
      where: { OR: whereClauses },
      include: {
        module: true,
        submissions: {
          where: { student_id: studentId },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { deadline: 'asc' },
    });

    const formattedAssessments = assessments.map((assessment) => ({
      ...assessment,
      submission:
        assessment.submissions.length > 0
          ? assessment.submissions[0]
          : null,
    }));

    res.json(formattedAssessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: 'An error occurred while fetching assessments' });
  }
};

const getAssessmentById = async (req, res) => {
  const { assessment_id } = req.params;
  const { userId } = req.user;
  const studentId = await getStudentId(userId);
  if (!studentId) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { assessment_id },
      include: {
        module: true,
        submissions: {
          where: { student_id: studentId },
          orderBy: { createdAt: 'desc' },
        },
        createdByAssessor: {
          include: {
            user: true,
          }
        }
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        student_id: studentId,
        module_id: assessment.module_id,
      },
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Student not enrolled in this module' });
    }

    if (assessment.createdByAssessorId !== enrollment.assessor_id) {
      return res.status(403).json({ error: 'You are not authorized to view this assessment' });
    }

    res.json(assessment);
  } catch (error) {
    console.error('Error fetching assessment by ID:', error);
    res.status(500).json({ error: 'An error occurred while fetching the assessment' });
  }
};

const generateUploadSignature = async (req, res) => {
  const { folder } = req.body;
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({ timestamp, signature });
  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    res.status(500).json({ error: 'Failed to generate upload signature' });
  }
};

const submitAssessment = async (req, res) => {
  const { assessment_id } = req.params;
  const { userId } = req.user;
  const { submissionData } = req.body;

  const studentId = await getStudentId(userId);
  if (!studentId) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { assessment_id },
      include: { module: true },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const existingSubmissions = await prisma.submission.count({
      where: { assessment_id, student_id: studentId },
    });

    if (assessment.maxAttempts && existingSubmissions >= assessment.maxAttempts) {
      return res.status(400).json({ error: 'Maximum submission attempts reached' });
    }

    const submission = await prisma.submission.create({
      data: {
        assessment_id,
        student_id: studentId,
        data: submissionData,
        attempts: existingSubmissions + 1,
      },
    });

    if (assessment.rubric) {
      const rubric = typeof assessment.rubric === 'string' 
        ? JSON.parse(assessment.rubric) 
        : assessment.rubric;

      const allQuestionsAreMcq = rubric.questions.every(
        (q) => q.type === 'MCQ'
      );

      const grade = scoring.autoGrade(submissionData, rubric);

      // --- NEW COMPETENCY LOGIC ---
      const evidenceToCreate = [];

      rubric.questions.forEach((question, index) => {
        // Check if the question is an MCQ, has competency IDs, and was answered correctly
        if (question.type === 'MCQ' && question.competencyIds && question.competencyIds.length > 0) {
          const submittedAnswer = submissionData.answers[index];
          const correctAnswer = rubric.answers[index]; // Assuming rubric.answers holds correct answers

          // Ensure correctAnswer is not null/undefined and matches the submitted answer
          if (correctAnswer !== null && correctAnswer !== undefined && submittedAnswer == correctAnswer) { // Use loose equality for potential type coercion (string vs number)
            // MCQ answered correctly, create evidence for associated competencies
            question.competencyIds.forEach(competencyId => {
              evidenceToCreate.push({
                studentId: studentId,
                competencyId: competencyId,
                moduleId: assessment.module_id,
                assessmentId: assessment.assessment_id,
                status: 'SUCCESS', // Mark as SUCCESS if answered correctly
              });
            });
          }
        }
      });

      if (evidenceToCreate.length > 0) {
        await prisma.studentCompetencyEvidence.createMany({
          data: evidenceToCreate,
          skipDuplicates: true, // Avoid creating duplicate evidence if already exists
        });
      }
      // --- END NEW COMPETENCY LOGIC ---

      await prisma.submission.update({
        where: { submission_id: submission.submission_id },
        data: {
          grade,
          gradedAt: allQuestionsAreMcq ? new Date() : null,
        },
      });

      const notificationMessage = allQuestionsAreMcq
        ? `Your submission for "${assessment.title}" has been auto-graded.`
        : `Your submission for "${assessment.title}" has been received and partially auto-graded.`;

      await prisma.notification.create({
        data: {
          userId,
          message: notificationMessage,
          read: false,
        },
      });
    }

    res.status(201).json(submission);
  } catch (error) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({ error: 'An error occurred while submitting the assessment' });
  }
};

const getSubmissions = async (req, res) => {
  const { userId } = req.user;
  const studentId = await getStudentId(userId);
  if (!studentId) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  try {
    const submissions = await prisma.submission.findMany({
      where: { student_id: studentId },
      include: {
        assessment: { 
          include: { 
            module: {
              include: {
                offerings: {
                  include: {
                    semester: {
                      include: {
                        academicYear: true,
                      },
                    },
                  },
                },
              },
            },
          } 
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const observations = await prisma.observation.findMany({
      where: {
        students: {
          some: {
            studentId: studentId,
          },
        },
      },
      include: {
        module: {
          include: {
            offerings: {
              include: {
                semester: {
                  include: {
                    academicYear: true,
                  },
                },
              },
            },
          },
        },
        assessor: { include: { user: true } },
      },
      orderBy: { recordedAt: 'desc' },
    });

    const formattedSubmissions = submissions.map((s) => ({
      ...s,
      type: 'submission',
    }));

    const formattedObservations = observations.map((o) => ({
      ...o,
      type: 'observation',
      createdAt: o.recordedAt,
    }));

    const feed = [...formattedSubmissions, ...formattedObservations].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(feed);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'An error occurred while fetching submissions' });
  }
};

const getSubmissionById = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const studentId = await getStudentId(userId);

  if (!studentId) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  try {
    const submission = await prisma.submission.findUnique({
      where: { submission_id: id },
      include: {
        assessment: { include: { module: true } },
      },
    });

    if (!submission || submission.student_id !== studentId) {
      return res.status(404).json({ error: 'Submission not found or unauthorized' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission by ID:', error);
    res.status(500).json({ error: 'An error occurred while fetching the submission' });
  }
};

const completeOnboarding = async (req, res) => {
  const { userId } = req.user;

  try {
    await prisma.user.update({
      where: { user_id: userId },
      data: { onboardingCompleted: true },
    });

    res.status(200).json({ message: 'Onboarding completed successfully' });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ error: 'An error occurred while completing onboarding' });
  }
};

const getMyModules = async (req, res) => {
  const { userId } = req.user;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const studentId = await getStudentId(userId);
  if (!studentId) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: studentId },
      include: { module: true },
      skip: parseInt(offset),
      take: parseInt(limit),
    });

    const totalEnrollments = await prisma.enrollment.count({
      where: { student_id: studentId },
    });

    // Fetch micro-credentials to determine completion status
    const microCredentials = await prisma.microCredential.findMany({
      where: { student_id: studentId },
      select: { module_id: true },
    });

    const completedModuleIds = new Set(microCredentials.map(mc => mc.module_id));

    const modules = enrollments.map((e) => ({
      ...e.module,
      completed: completedModuleIds.has(e.module.module_id),
    }));

    res.json({
      modules,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalEnrollments / limit),
      totalModules: totalEnrollments,
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'An error occurred while fetching modules' });
  }
};

const getModuleById = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  const studentId = await getStudentId(userId);
  if (!studentId) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  try {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        student_id: studentId,
        module_id: id,
      },
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Student not enrolled in this module' });
    }
    
    const module = await prisma.module.findUnique({
      where: { module_id: id },
    });

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const assessments = await prisma.assessment.findMany({
      where: { 
        module_id: id,
        createdByAssessorId: enrollment.assessor_id,
      },
      include: {
        submissions: {
          where: { student_id: studentId },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        createdByAssessor: {
          include: {
            user: true,
          },
        },
      },
    });

    const formattedAssessments = assessments.map((a) => ({
      ...a,
      submission: a.submissions.length > 0 ? a.submissions[0] : null,
    }));

    res.json({ ...module, assessments: formattedAssessments });
  } catch (error) {
    console.error('Error fetching module by ID:', error);
    res.status(500).json({ error: 'An error occurred while fetching the module' });
  }
};

const getMyObservations = async (req, res) => {
  const { userId } = req.user;
  const studentId = await getStudentId(userId);

  if (!studentId) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  try {
    const observations = await prisma.observation.findMany({
      where: { student_id: studentId },
      orderBy: { recordedAt: 'desc' },
    });

    res.json(observations);
  } catch (error) {
    console.error('Error fetching student observations:', error);
    res.status(500).json({ error: 'An error occurred while fetching student observations' });
  }
};

const getObservationById = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  const studentId = await getStudentId(userId);
  if (!studentId) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  try {
    const observation = await prisma.observation.findUnique({
      where: { id },
    });

    if (!observation || observation.student_id !== studentId) {
      return res.status(404).json({ error: 'Observation not found or unauthorized' });
    }

    res.json(observation);
  } catch (error) {
    console.error('Error fetching observation by ID:', error);
    res.status(500).json({ error: 'An error occurred while fetching the observation' });
  }
};

const getAllNotifications = async (req, res) => {
  const { userId } = req.user;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'An error occurred while fetching notifications' });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  const { userId } = req.user;

  try {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'An error occurred while marking notifications as read' });
  }
};

const markNotificationAsRead = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  try {
    await prisma.notification.update({
      where: { id, userId },
      data: { read: true },
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'An error occurred while marking notification as read' });
  }
};

module.exports = {
  getDashboard,
  getWallet,
  getAssessments,
  getAssessmentById,
  generateUploadSignature,
  submitAssessment,
  getSubmissions,
  getSubmissionById,
  completeOnboarding,
  getMyModules,
  getModuleById,
  getMyObservations,
  getObservationById,
  getAllNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  getUpcomingAssessments,
};
