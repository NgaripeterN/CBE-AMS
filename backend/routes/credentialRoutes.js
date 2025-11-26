const express = require('express');
const router = express.Router();
const credentialController = require('../controllers/credentialController');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const studentOnly = require('../middleware/studentOnly');

// @desc    Generate a shareable link for a credential
// @route   POST /api/credentials/:type/:id/share
// @access  Private/Student
router.post('/:type/:id/share', isAuthenticated, studentOnly, credentialController.generateShareLink);

// @desc    Send a credential via email
// @route   POST /api/credentials/share/email
// @access  Private/Student
router.post('/share/email', isAuthenticated, studentOnly, credentialController.sendShareEmail);

module.exports = router;