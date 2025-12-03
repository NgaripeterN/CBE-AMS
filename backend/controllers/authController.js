const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Helper function to determine the user's effective role and associated lead course
const getEffectiveUserRoles = async (user) => {
    let effectiveRole = user.role;
    let leadForCourseId = null;
    let assessorDetails = null;

    if (user.role === 'ADMIN') {
        // Admins are already the highest role.
    } else if (user.role === 'ASSESSOR' || user.role === 'STUDENT') {
        // Check if this ASSESSOR or STUDENT is also a LEAD for any course
        assessorDetails = await prisma.assessor.findUnique({ where: { userId: user.user_id } });
        if (assessorDetails) {
            const courseAssignment = await prisma.courseAssignment.findFirst({
                where: { assessorId: assessorDetails.id, role: 'LEAD' },
            });
            if (courseAssignment) {
                effectiveRole = 'LEAD'; // Promote to LEAD if they are assigned as one
                leadForCourseId = courseAssignment.courseId;
            }
        }
    }
    
    return { effectiveRole, leadForCourseId, assessorDetails };
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.user.update({
        where: { email },
        data: { otp, otpExpires, otpSentAt: new Date() },
      });

      // In a real app, you would send the OTP via email or SMS
      console.log(`OTP for ${email}: ${otp}`);

      res.json({ message: 'OTP sent to your email address.' });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during login' });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: 'Invalid user' });
    }

    // Bypass OTP check for any non-empty OTP as requested for development
    if (!otp) {
        return res.status(400).json({ error: 'OTP cannot be empty' });
    }

    console.log(`OTP check bypassed for user: ${email}`);


    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        otp: null,
        otpExpires: null,
        otpSentAt: null,
      },
    });

    // Determine effective role and leadForCourseId
    const { effectiveRole, leadForCourseId } = await getEffectiveUserRoles(user);

    const token = jwt.sign(
      { userId: user.user_id, role: effectiveRole, leadForCourseId, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: effectiveRole, // Use effective role here
      leadForCourseId,
      mustChangePassword: user.status === 'PENDING_PASSWORD_CHANGE',
      onboardingCompleted: user.onboardingCompleted,
      program: user.program,
    });
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

const resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { email },
      data: { otp, otpExpires, otpSentAt: new Date() },
    });

    // In a real app, you would send the OTP via email or SMS
    console.log(`OTP for ${email}: ${otp}`);

    res.json({ message: 'OTP resent to your email address.' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
};


// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { user_id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine effective role and leadForCourseId
    const { effectiveRole, leadForCourseId, assessorDetails } = await getEffectiveUserRoles(user);

    res.json({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: effectiveRole, // Use effective role here
      leadForCourseId,
      mustChangePassword: user.status === 'PENDING_PASSWORD_CHANGE',
      onboardingCompleted: user.onboardingCompleted,
      program: user.program,
      assessor: assessorDetails, // Include assessor details if available
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { userId } = req.user;

  try {
    const user = await prisma.user.findUnique({ where: { user_id: userId } });

    if (user.status !== 'PENDING_PASSWORD_CHANGE' && (!user || !(await bcrypt.compare(currentPassword, user.passwordHash)))) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { user_id: userId },
      data: { 
        passwordHash,
        status: 'ACTIVE'
      },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while changing password' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Send a generic success message to prevent user enumeration
      return res.json({ message: 'If a user with that email exists, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { email },
      data: { passwordResetToken, passwordResetExpires },
    });

    // In a real app, you would send an email with the reset link
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    console.log('Password reset link:', resetUrl);

    res.json({ message: 'If a user with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        status: 'ACTIVE',
      },
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

module.exports = { 
  login, 
  getMe, 
  changePassword,
  forgotPassword,
  resetPassword,
  verifyOtp,
  resendOtp
};