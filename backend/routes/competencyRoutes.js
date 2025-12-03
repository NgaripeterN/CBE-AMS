const express = require('express');
const router = express.Router();
const multer = require('multer');
const competencyController = require('../controllers/competencyController');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const { adminOnly } = require('../middleware/adminOnly');

const upload = multer({ storage: multer.memoryStorage() });

// All competency routes require authentication
router.use(isAuthenticated);

// Admin-only routes for CUD operations
router.post('/bulk-import', adminOnly, upload.single('competenciesCsv'), competencyController.bulkImportCompetencies);

router.route('/')
  .get(competencyController.getAllCompetencies) // Accessible by all authenticated users
  .post(adminOnly, competencyController.createCompetency);

router.route('/:id')
  .get(competencyController.getCompetencyById) // Accessible by all authenticated users
  .put(adminOnly, competencyController.updateCompetency)
  .delete(adminOnly, competencyController.deleteCompetency);

module.exports = router;
