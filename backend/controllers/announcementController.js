const prisma = require('../lib/prisma');

// @desc    Create a new announcement
// @route   POST /api/announcements
// @access  Private/Assessor
const createAnnouncement = async (req, res) => {
  const { title, content, moduleId } = req.body;
  const { userId } = req.user;
  try {
    const assessor = await prisma.assessor.findUnique({ where: { userId } });
    if (!assessor) {
      return res.status(404).json({ error: 'Assessor profile not found' });
    }

    const module = await prisma.module.findUnique({ where: { module_id: moduleId } });
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        moduleId,
        assessorId: assessor.id,
      },
    });

    const enrollments = await prisma.enrollment.findMany({
      where: { offering: { moduleId: moduleId } },
      include: { student: { include: { user: true } } },
    });

    const notifications = enrollments.map(enrollment => ({
      userId: enrollment.student.userId,
      message: `New announcement in "${module.title}": ${announcement.title} - ${announcement.content}`,
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    res.status(201).json(announcement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'An error occurred while creating the announcement' });
  }
};

// @desc    Get all announcements for a module
// @route   GET /api/announcements/:moduleId
// @access  Private
const getAnnouncementsForModule = async (req, res) => {
  const { moduleId } = req.params;
  console.log(`Fetching announcements for module: ${moduleId}`);
  try {
    const announcements = await prisma.announcement.findMany({
      where: { moduleId },
      include: {
        assessor: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'An error occurred while fetching announcements' });
  }
};

const getAllAnnouncements = async (req, res) => {
  res.json([]);
};

// @desc    Update an announcement
// @route   PUT /api/announcements/:id
// @access  Private/Assessor
const updateAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const { userId } = req.user;

  try {
    const assessor = await prisma.assessor.findUnique({ where: { userId } });
    if (!assessor) {
      return res.status(404).json({ error: 'Assessor profile not found' });
    }

    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.assessorId !== assessor.id) {
      return res.status(403).json({ error: 'You are not authorized to update this announcement' });
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: { title, content },
    });

    res.json(updatedAnnouncement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'An error occurred while updating the announcement' });
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Assessor
const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    const assessor = await prisma.assessor.findUnique({ where: { userId } });
    if (!assessor) {
      return res.status(404).json({ error: 'Assessor profile not found' });
    }

    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.assessorId !== assessor.id) {
      return res.status(403).json({ error: 'You are not authorized to delete this announcement' });
    }

    await prisma.announcement.delete({ where: { id } });

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'An error occurred while deleting the announcement' });
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncementsForModule,
  getAllAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
};