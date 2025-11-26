const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { isAuthenticated } = require('../middleware/isAuthenticated');

// All routes in this file are protected
router.use(isAuthenticated);

router.get('/:id', moduleController.getModuleById);
router.get('/:id/assessors', moduleController.getAssignedAssessors);
router.get('/:id/students', moduleController.getEnrolledStudents);

module.exports = router;