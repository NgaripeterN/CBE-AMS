
const express = require('express');
const router = express.Router();
const { createAcademicYear, getAcademicYears, deleteAcademicYear } = require('../controllers/academicYearController');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const isCalendarAdmin = require('../middleware/isCalendarAdmin');

router.post('/', isAuthenticated, isCalendarAdmin, createAcademicYear);
router.get('/', isAuthenticated, getAcademicYears);
router.delete('/:id', isAuthenticated, isCalendarAdmin, deleteAcademicYear);

module.exports = router;
