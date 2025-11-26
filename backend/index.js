const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const leadRoutes = require('./routes/leadRoutes');
const assessorRoutes = require('./routes/assessorRoutes');
const courseRoutes = require('./routes/courseRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const credentialRoutes = require('./routes/credentialRoutes');
const unifiedCurriculumRoutes = require('./routes/unifiedCurriculum.js');
const unifiedEnrollmentRoutes = require('./routes/unifiedEnrollment.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/lead', leadRoutes);
app.use('/api/assessor', assessorRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/curriculum', unifiedCurriculumRoutes);
app.use('/api/enrollments', unifiedEnrollmentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});