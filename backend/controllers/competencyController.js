const prisma = require('../lib/prisma');
const csv = require('csv-parser');
const stream = require('stream');

// @desc    Get all competencies
// @route   GET /api/competencies
// @access  Private/Admin
const getAllCompetencies = async (req, res) => {
  try {
    const competencies = await prisma.competency.findMany({
      orderBy: {
        category: 'asc',
      },
      include: {
        courses: true, // Include associated courses
      },
    });
    res.json(competencies);
  } catch (error) {
    console.error('Error fetching competencies:', error);
    res.status(500).json({ error: 'An error occurred while fetching competencies' });
  }
};

// @desc    Get a single competency by ID
// @route   GET /api/competencies/:id
// @access  Private/Admin
const getCompetencyById = async (req, res) => {
  const { id } = req.params;
  try {
    const competency = await prisma.competency.findUnique({
      where: { id },
      include: {
        courses: true, // Include associated courses
      },
    });
    if (!competency) {
      return res.status(404).json({ error: 'Competency not found' });
    }
    res.json(competency);
  } catch (error) {
    console.error(`Error fetching competency ${id}:`, error);
    res.status(500).json({ error: 'An error occurred while fetching the competency' });
  }
};

// @desc    Create a new competency
// @route   POST /api/competencies
// @access  Private/Admin
const createCompetency = async (req, res) => {
  const { name, description, category, courseIds } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'Name and category are required' });
  }

  try {
    const competency = await prisma.competency.create({
      data: {
        name,
        description,
        category,
        courses: {
          connect: courseIds ? courseIds.map(id => ({ course_id: id })) : [],
        },
      },
    });
    res.status(201).json(competency);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A competency with this name already exists' });
    }
    console.error('Error creating competency:', error);
    res.status(500).json({ error: 'An error occurred while creating the competency' });
  }
};

// @desc    Update a competency
// @route   PUT /api/competencies/:id
// @access  Private/Admin
const updateCompetency = async (req, res) => {
  const { id } = req.params;
  const { name, description, category, courseIds } = req.body;

  try {
    const updatedCompetency = await prisma.competency.update({
      where: { id },
      data: {
        name,
        description,
        category,
        courses: {
          set: courseIds ? courseIds.map(id => ({ course_id: id })) : [],
        },
      },
    });
    res.json(updatedCompetency);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A competency with this name already exists' });
    }
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Competency not found' });
    }
    console.error(`Error updating competency ${id}:`, error);
    res.status(500).json({ error: 'An error occurred while updating the competency' });
  }
};

// @desc    Delete a competency
// @route   DELETE /api/competencies/:id
// @access  Private/Admin
const deleteCompetency = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.competency.delete({
      where: { id },
    });
    res.json({ message: 'Competency deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Competency not found' });
    }
    console.error(`Error deleting competency ${id}:`, error);
    res.status(500).json({ error: 'An error occurred while deleting the competency' });
  }
};

// @desc    Bulk import competencies from CSV
// @route   POST /api/competencies/bulk-import
// @access  Private/Admin
const bulkImportCompetencies = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const results = [];
  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.file.buffer);

  bufferStream
    .pipe(csv())
    .on('data', (data) => {
      if (data.name && data.category) {
        results.push({
          name: data.name,
          description: data.description || '',
          category: data.category,
          courseCodes: data.associatedCourseCodes ? data.associatedCourseCodes.split(';').map(c => c.trim()).filter(c => c) : [],
        });
      }
    })
    .on('end', async () => {
      if (results.length === 0) {
        return res.status(400).json({ error: 'CSV file is empty or missing required columns (name, category).' });
      }

      try {
        const allCourseCodes = [...new Set(results.flatMap(r => r.courseCodes))];
        const courses = await prisma.course.findMany({
          where: { code: { in: allCourseCodes } },
          select: { course_id: true, code: true },
        });
        const courseCodeToIdMap = new Map(courses.map(c => [c.code, c.course_id]));

        const competenciesToCreate = results.map(r => {
          const courseIds = r.courseCodes.map(code => courseCodeToIdMap.get(code)).filter(id => id);
          return {
            name: r.name,
            description: r.description,
            category: r.category,
            courses: {
              connect: courseIds.map(id => ({ course_id: id })),
            },
          };
        });
        
        // We cannot use createMany with relations, so we must loop.
        // We will do this in a transaction to ensure atomicity.
        const createdCount = await prisma.$transaction(async (tx) => {
          let count = 0;
          for (const compData of competenciesToCreate) {
            const existing = await tx.competency.findUnique({ where: { name: compData.name } });
            if (!existing) {
              await tx.competency.create({ data: compData });
              count++;
            }
          }
          return count;
        });

        res.status(201).json({ message: `Successfully imported ${createdCount} new competencies.` });
      } catch (error) {
        console.error('Error during bulk import:', error);
        res.status(500).json({ error: 'An error occurred during the bulk import process.' });
      }
    });
};

module.exports = {
  getAllCompetencies,
  getCompetencyById,
  createCompetency,
  updateCompetency,
  deleteCompetency,
  bulkImportCompetencies,
};
