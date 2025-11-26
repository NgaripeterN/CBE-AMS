const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const assessorOnly = require('../middleware/assessorOnly');
const isModuleAssessor = require('../middleware/isModuleAssessor');

router.use(isAuthenticated);

router.post('/', assessorOnly, announcementController.createAnnouncement);
router.get('/', announcementController.getAllAnnouncements);
router.get('/:moduleId', isModuleAssessor, announcementController.getAnnouncementsForModule);
router.put('/:id', assessorOnly, announcementController.updateAnnouncement);
router.delete('/:id', assessorOnly, announcementController.deleteAnnouncement);

module.exports = router;