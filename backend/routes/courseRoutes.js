const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { isAuthenticated } = require('../middleware/isAuthenticated');

router.use(isAuthenticated);

router.get('/:id', courseController.getCourseById);

module.exports = router;
