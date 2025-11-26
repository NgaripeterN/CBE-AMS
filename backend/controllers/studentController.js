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

const getDashboard = async (req, res) => {
  const { userId } = req.user;
  const studentId = await getStudentId(userId);
  if (!studentId) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  try {
    const unreadNotificationsCount = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    const microCredentialsCount = await prisma.microCredential.count({
        where: {
            student_id: studentId,
        },
    });

    const courseCredentialsCount = await prisma.courseCredential.count({
        where: {
            student_id: studentId,
        },
    });

    const credentialsEarned = microCredentialsCount + courseCredentialsCount;

    const totalModulesEnrolled = await prisma.enrollment.count({
        where: {
            student_id: studentId,
        },
    });

    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: studentId },
      select: {
        assignedAssessorId: true,
        offering: {
          select: {
            moduleId: true,
          },
        },
      },
    });

    const whereClauses = enrollments
      .filter((e) => e.assignedAssessorId)
      .map((e) => ({
        module_id: e.offering.moduleId,
        createdById: e.assignedAssessorId,
      }));

    const pendingAssessmentsCount = whereClauses.length > 0 ? await prisma.assessment.count({
      where: {
        OR: whereClauses,
        submissions: {
          none: {
            student_id: studentId,
          },
        },
      },
    }) : 0;

    res.json({
      unreadNotificationsCount,
      credentialsEarned,
      totalModulesEnrolled,
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
    });
    const courseCredentials = await prisma.courseCredential.findMany({
      where: { student_id: studentId },
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
    const assessments = await prisma.assessment.findMany({
      where: {
        module: {
          offerings: {
            some: {
              enrollments: {
                some: {
                  student_id: studentId,
                },
              },
            },
          },
        },
      },
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
      submission: assessment.submissions.length > 0 ? assessment.submissions[0] : null,
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
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        student_id: studentId,
        offering: {
          moduleId: assessment.module_id,
        },
      },
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Student not enrolled in this module' });
    }

    if (assessment.createdById !== enrollment.assignedAssessorId) {
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
      { timestamp: timestamp, folder: folder },
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
      where: {
        assessment_id,
        student_id: studentId,
      },
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
      const rubric = JSON.parse(assessment.rubric);
      const allQuestionsAreMcq = rubric.questions.every(q => q.type === 'MCQ');
      const grade = scoring.autoGrade(submissionData, assessment.rubric);

      await prisma.submission.update({
        where: { submission_id: submission.submission_id },
        data: {
          grade: grade,
          gradedAt: allQuestionsAreMcq ? new Date() : null,
        },
      });

      const notificationMessage = allQuestionsAreMcq
        ? `Your submission for "${assessment.title}" has been auto-graded.`
        : `Your submission for "${assessment.title}" has been received and partially auto-graded.`;

      await prisma.notification.create({
        data: {
          userId: userId,
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
      include: { assessment: { include: { module: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const observations = await prisma.observation.findMany({
        where: { student_id: studentId },
        include: { module: true, assessor: { include: { user: true } } },
        orderBy: { recordedAt: 'desc' },
    });

    const formattedSubmissions = submissions.map(s => ({ ...s, type: 'submission' }));
    const formattedObservations = observations.map(o => ({ ...o, type: 'observation', createdAt: o.recordedAt }));

    const feed = [...formattedSubmissions, ...formattedObservations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
      include: { assessment: { include: { module: true } } },
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
      include: {
        offering: {
          include: {
            module: true,
          },
        },
      },
      skip: parseInt(offset),
      take: parseInt(limit),
    });

    const totalEnrollments = await prisma.enrollment.count({
      where: { student_id: studentId },
    });

    const modules = enrollments.map((enrollment) => enrollment.offering.module);

    res.json({
      modules,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalEnrollments / limit),
      totalModules: totalEnrollments,
    });
  } catch (error) {
    console.error('Error fetching student modules:', error);
    res.status(500).json({ error: 'An error occurred while fetching student modules' });
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
        offering: {
          moduleId: id,
        },
      },
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Student not enrolled in this module' });
    }

    console.log('studentId:', studentId);
    console.log('assignedAssessorId:', enrollment.assignedAssessorId);

    const module = await prisma.module.findUnique({
      where: { module_id: id },
    });

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    let assessments = [];
    if (enrollment.assignedAssessorId) {
      assessments = await prisma.assessment.findMany({
        where: {
          module_id: id,
          createdById: enrollment.assignedAssessorId,
        },
        include: {
          submissions: {
            where: { student_id: studentId },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    }

    console.log('assessments:', assessments);

    const formattedAssessments = assessments.map((assessment) => ({
      ...assessment,
      submission: assessment.submissions.length > 0 ? assessment.submissions[0] : null,
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
            where: {
                userId,
                read: false,
            },
            data: {
                read: true,
            },
        });
        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ error: 'An error occurred while marking notifications as read' });
    }
}

const markNotificationAsRead = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    try {
        await prisma.notification.update({
            where: {
                id: id,
                userId: userId,
            },
            data: {
                read: true,
            },
        });
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'An error occurred while marking notification as read' });
    }
}

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
};