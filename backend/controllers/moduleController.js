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
        competencies: true, // Include competencies
      }
    });
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json(module);
  } catch (error) {
    console.error(`Error fetching module ${id}:`, error);
    res.status(500).json({ error: 'An error occurred while fetching the module' });
  }
};

// @desc    Get assigned assessors for a module
// @route   GET /api/modules/:id/assessors
// @access  Private
const getAssignedAssessors = async (req, res) => {
  const { id } = req.params;
  try {
    const moduleAssignments = await prisma.moduleAssignment.findMany({
      where: { moduleId: id },
      include: {
        assessor: {
          include: {
            user: true,
          },
        },
      },
    });
    res.json(moduleAssignments.map(assignment => assignment.assessor));
  } catch (error) {
    console.error(`Error fetching assessors for module ${id}:`, error);
    res.status(500).json({ error: 'An error occurred while fetching module assessors' });
  }
};

// @desc    Get enrolled students for a module
// @route   GET /api/modules/:id/students
// @access  Private
const getEnrolledStudents = async (req, res) => {
  const { id } = req.params;
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { 
        module_id: id,
        status: 'ACTIVE', // Only fetch active enrollments
      },
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
    console.error(`Error fetching students for module ${id}:`, error);
    res.status(500).json({ error: 'An error occurred while fetching module students' });
  }
};


// @desc    Update the competencies for a specific module
// @route   PUT /api/modules/:id/competencies
// @access  Private/Lead
const updateModuleCompetencies = async (req, res) => {
  const { id } = req.params;
  const { competencyIds } = req.body;

  if (!Array.isArray(competencyIds)) {
    return res.status(400).json({ error: 'competencyIds must be an array' });
  }

  try {
    const updatedModule = await prisma.module.update({
      where: { module_id: id },
      data: {
        competencies: {
          set: competencyIds.map(competencyId => ({ id: competencyId })),
        },
      },
      include: {
        competencies: true,
      },
    });

    res.json(updatedModule);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Module not found' });
    }
    console.error(`Error updating competencies for module ${id}:`, error);
    res.status(500).json({ error: 'An error occurred while updating module competencies' });
  }
};

module.exports = {
  getModuleById,
  getAssignedAssessors,
  getEnrolledStudents,
  updateModuleCompetencies,
};