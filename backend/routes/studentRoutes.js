const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getWallet,
  getAssessments,
  getAssessmentById,
  getSubmissions,
  getSubmissionById,
  getMyModules,
  getModuleById,
  getObservationById,
  generateUploadSignature,
  submitAssessment,
  completeOnboarding,
  getAllNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  getMyObservations,
  getUpcomingAssessments,
} = require('../controllers/studentController');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const studentOnly = require('../middleware/studentOnly');

// All routes in this file are protected and restricted to STUDENT role
router.use(isAuthenticated);
router.use(studentOnly);

router.get('/dashboard', getDashboard);
router.get('/wallet', getWallet);
router.get('/assessments', getAssessments);
router.get('/assessments/upcoming', getUpcomingAssessments);
router.get('/assessments/:assessment_id', getAssessmentById);
router.get('/submissions', getSubmissions);
router.get('/submission/:id', getSubmissionById);
router.get('/my-modules', getMyModules);
router.get('/my-modules/:id', getModuleById);
router.get('/observations/:id', getObservationById);
router.post('/generate-upload-signature', generateUploadSignature);
router.post('/submit/:assessment_id', submitAssessment);
router.post('/complete-onboarding', completeOnboarding);

router.get('/notifications', getAllNotifications);
router.post('/notifications/mark-as-read', markAllNotificationsAsRead);
router.post('/notifications/:id/mark-as-read', markNotificationAsRead);

// @desc    Get all observations for the logged in student
// @route   GET /api/student/my-observations
// @access  Private (Student)
router.get('/my-observations', getMyObservations);

module.exports = router;
