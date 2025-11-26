const prisma = require('../lib/prisma');

// @desc    Get a single module by ID
// @route   GET /api/modules/:id
// @access  Private
const getModuleById = async (req, res) => {
  const { id } = req.params;

  try {
    const module = await prisma.module.findUnique({
      where: { module_id: id },
      include: {
        course: true,
      },
    });

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json(module);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the module' });
  }
};

// @desc    Get all assessors assigned to a module
// @route   GET /api/modules/:id/assessors
// @access  Private
const getAssignedAssessors = async (req, res) => {
  const { id } = req.params;

  try {
    const assignments = await prisma.moduleAssignment.findMany({
      where: { moduleId: id },
      include: {
        assessor: {
          include: {
            user: true,
          },
        },
      },
    });

    const assessors = assignments.map(a => a.assessor);
    res.json(assessors);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching assigned assessors' });
  }
};

// @desc    Get all students enrolled in a module
// @route   GET /api/modules/:id/students
// @access  Private
const getEnrolledStudents = async (req, res) => {
    const { id } = req.params; // This is module_id
    const { userId, role, leadForCourseId } = req.user;
  
    try {
      const module = await prisma.module.findUnique({ where: { module_id: id } });
      if (!module) {
        return res.status(404).json({ error: 'Module not found' });
      }
  
      // Find all offerings for this module
      const offerings = await prisma.offering.findMany({
        where: { moduleId: id },
        select: { id: true },
      });
      const offeringIds = offerings.map(o => o.id);
  
      let whereClause = {
        offeringId: { in: offeringIds },
      };
  
      const isLeadForThisCourse = (role === 'LEAD' && leadForCourseId === module.course_id) || role === 'ADMIN';
  
      if (!isLeadForThisCourse && (role === 'ASSESSOR' || role === 'LEAD')) {
        const assessor = await prisma.assessor.findUnique({ where: { userId } });
        if (assessor) {
          whereClause.assignedAssessorId = assessor.id;
  
          const assessorOfferings = await prisma.offeringAssignment.findMany({
            where: { assessorId: assessor.id },
            select: { offeringId: true },
          });
          const assessorOfferingIds = assessorOfferings.map(ao => ao.offeringId);
  
          whereClause.offeringId = {
            in: offeringIds.filter(id => assessorOfferingIds.includes(id)),
          };
        }
      } else if (role === 'STUDENT') {
        const student = await prisma.student.findUnique({ where: { userId } });
        if(student) {
          whereClause = {
            ...whereClause,
            student_id: student.id,
          };
        }
      }
  
      const enrollments = await prisma.enrollment.findMany({
        where: whereClause,
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      });
  
      res.json(enrollments);
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      res.status(500).json({ error: 'An error occurred while fetching enrolled students' });
    }
  };

module.exports = {
  getModuleById,
  getAssignedAssessors,
  getEnrolledStudents,
};