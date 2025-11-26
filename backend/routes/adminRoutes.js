const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  createAssessor,
  createStudent,
  getUsers,
  updateUser,
  deleteUser,
  importUsers,
  importCourses,
  getCourses,
  getCourseById,
  createCourse,
  approveCourse,
  updateCourse,
  deleteCourse,
  getAssessors,
  getStudents,
  createModule,
  getModules,
  getModulesForCourse,
  updateModule,
  deleteModule,
  assignAssessorToCourse,
  assignLeadToCourse,
  assignAssessorToModule,
  getCourseLeads,
  getModuleAuditTrail,
  getDashboardExtendedStats,
} = require('../controllers/adminController');
const { adminOnly } = require('../middleware/adminOnly');

// All routes in this file are protected and restricted to ADMIN role
router.use(adminOnly);

// Dashboard routes
router.get('/dashboard-stats', getDashboardStats);
router.get('/dashboard-extended-stats', getDashboardExtendedStats);

// User management routes
router.post('/create-assessor', createAssessor);
router.post('/create-student', createStudent);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/import-users', importUsers);
router.get('/assessors', getAssessors);
router.get('/students', getStudents);

// Course management routes
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseById);
router.post('/courses', createCourse);
router.post('/approve-course/:id', approveCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);
router.post('/import-courses', importCourses);

// Module management routes
router.post('/modules', createModule);
router.get('/modules', getModules);
router.get('/courses/:id/modules', getModulesForCourse);
router.put('/modules/:moduleId', updateModule);
router.delete('/modules/:moduleId', deleteModule);
router.get('/modules/:moduleId/audit', getModuleAuditTrail);

// Assessor assignment routes
router.post('/courses/:courseId/assign-assessor', assignAssessorToCourse);
router.post('/assign-lead-to-course', assignLeadToCourse);
router.post('/modules/:moduleId/assign-assessor', assignAssessorToModule);
router.get('/course-leads', getCourseLeads);

module.exports = router;