const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const studentOnly = require('../middleware/studentOnly');

// All routes in this file are protected and restricted to STUDENT role
router.use(isAuthenticated);
router.use(studentOnly);

router.get('/dashboard', studentController.getDashboard);
router.get('/wallet', studentController.getWallet);
router.get('/assessments', studentController.getAssessments);
router.get('/assessments/:assessment_id', studentController.getAssessmentById);
router.get('/submissions', studentController.getSubmissions);
router.get('/submission/:id', studentController.getSubmissionById);
router.get('/my-modules', studentController.getMyModules);
router.get('/my-modules/:id', studentController.getModuleById);
router.get('/observations/:id', studentController.getObservationById);
router.post('/generate-upload-signature', studentController.generateUploadSignature);
router.post('/submit/:assessment_id', studentController.submitAssessment);
router.post('/complete-onboarding', studentController.completeOnboarding);

router.get('/notifications', studentController.getAllNotifications);
router.post('/notifications/mark-as-read', studentController.markAllNotificationsAsRead);
router.post('/notifications/:id/mark-as-read', studentController.markNotificationAsRead);

// @desc    Get all observations for the logged in student
// @route   GET /api/student/my-observations
// @access  Private (Student)
router.get('/my-observations', studentController.getMyObservations);

module.exports = router;
