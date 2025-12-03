const express = require('express');
const router = express.Router();
const multer = require('multer');
const assessorController = require('../controllers/assessorController');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const assessorOnly = require('../middleware/assessorOnly');
const isModuleAssessor = require('../middleware/isModuleAssessor');
const isEnrollmentAssessor = require('../middleware/isEnrollmentAssessor');

const upload = multer({ storage: multer.memoryStorage() });

// All routes in this file are protected and restricted to ASSESSOR role
router.use(isAuthenticated);
router.use(assessorOnly);

router.get('/courses', assessorController.getCourses);
router.get('/modules', assessorController.getModules);
router.get('/students', assessorController.getStudents);
router.get('/credential-tracking', assessorController.getCredentialTrackingData);
router.get('/student-progress', assessorController.getStudentProgressData);
router.get('/modules/:moduleId/submissions', isModuleAssessor, assessorController.getSubmissionsForModule);
router.get('/modules/:moduleId/observations', isModuleAssessor, assessorController.getObservationsForModule);
router.get('/modules/:module_id/assessments', isModuleAssessor, assessorController.getAssessmentsForModule);
router.get('/modules/:moduleId/offering', assessorController.getOfferingByModule);
router.get('/assessments/:id', assessorController.getAssessmentById);
router.post('/create-assessment/:module_id', isModuleAssessor, assessorController.createAssessment);
router.put('/assessments/:id', isModuleAssessor, assessorController.updateAssessment);
router.delete('/assessments/:id', isModuleAssessor, assessorController.deleteAssessment);
router.post('/enroll-student', isModuleAssessor, assessorController.enrollStudent);
router.post('/bulk-enroll', upload.single('file'), isModuleAssessor, assessorController.bulkEnroll);
router.delete('/enrollments/:enrollmentId', assessorController.unenrollStudent);
router.post('/record-observation', isModuleAssessor, assessorController.recordObservation);
router.put('/observations/:observationId', assessorController.updateObservation);
router.post('/grade-submission/:submission_id', assessorController.gradeSubmission);
router.get('/dashboard/recent-activity', assessorController.getRecentActivity);
router.get('/dashboard/random-submission', assessorController.getRandomSubmission);
router.get('/submissions/:submission_id/media/:question_index/url', isModuleAssessor, assessorController.getSubmissionMediaUrl);
router.get('/dashboard/metrics', assessorController.getDashboardMetrics);

module.exports = router;