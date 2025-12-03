const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const { isCourseLead } = require('../middleware/isCourseLead');

// All routes in this file are protected
router.use(isAuthenticated);

router.get('/:id', moduleController.getModuleById);
router.get('/:id/assessors', moduleController.getAssignedAssessors);
router.get('/:id/students', moduleController.getEnrolledStudents);

// Route for updating competencies - Lead only
router.put('/:id/competencies', isCourseLead, moduleController.updateModuleCompetencies);

module.exports = router;