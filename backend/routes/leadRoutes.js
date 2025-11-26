const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const { isCourseLead } = require('../middleware/isCourseLead');
const isLead = require('../middleware/isLead');

// All routes in this file are protected and restricted to LEAD role
router.use(isAuthenticated);

router.get('/my-course', isLead, leadController.getMyCourse);
router.get('/courses/:course_id', isCourseLead, leadController.getCourseById);
router.post('/create-module', isCourseLead, leadController.createModule);
router.post('/import-modules', isCourseLead, leadController.importModules);

router.put('/publish-module/:module_id', isCourseLead, leadController.publishModule);
router.post('/assign-assessors-to-module', isCourseLead, leadController.assignAssessorsToModule);
router.post('/unassign-assessor', isCourseLead, leadController.unassignAssessor);
router.post('/assign-assessor-to-student', isLead, leadController.assignAssessorToStudent);
router.post('/migrate-students', isCourseLead, leadController.migrateStudents);
router.get('/course-modules/:course_id', isCourseLead, leadController.getModulesForCourse);
router.get('/courses/:course_id/assessors', isCourseLead, leadController.getAssessorsForCourse);
router.get('/assessors', isLead, leadController.getAllAssessors);
router.put('/modules/:module_id', isCourseLead, leadController.updateModule);
router.delete('/modules/:module_id', isCourseLead, leadController.deleteModule);
router.put('/courses/:course_id/credential-rule', isCourseLead, leadController.updateCourseCredentialRule);
router.get('/courses/:course_id/modules', isCourseLead, leadController.getCourseModules);
router.get('/modules', isLead, leadController.getAllModules);
router.get('/courses/:course_id/students', isCourseLead, leadController.getStudentsForCourse);

module.exports = router;