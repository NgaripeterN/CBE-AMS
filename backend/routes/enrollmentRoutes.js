const express = require('express');
const router = express.Router();
const {
    enrollStudentInOffering,
    getEnrollmentsForOffering,
} = require('../controllers/enrollmentController');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const isModuleAssessor = require('../middleware/isModuleAssessor');

router.post('/', isAuthenticated, isModuleAssessor, enrollStudentInOffering);
router.get('/:offeringId', isAuthenticated, getEnrollmentsForOffering);

module.exports = router;