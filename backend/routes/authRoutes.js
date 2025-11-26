const express = require('express');
const router = express.Router();
const { login, getMe, changePassword, forgotPassword, resetPassword, verifyOtp, resendOtp } = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/isAuthenticated');

router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.get('/me', isAuthenticated, getMe);
router.post('/change-password', isAuthenticated, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
