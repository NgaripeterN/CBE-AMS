const prisma = require('../lib/prisma');

// @desc    Get all academic years
// @route   GET /api/curriculum/years
// @access  Private
const getAcademicYears = async (req, res) => {
    try {
        const academicYears = await prisma.academicYear.findMany({
            orderBy: {
                startDate: 'desc',
            },
        });
        res.json(academicYears);
    } catch (error) {
        console.error('Error fetching academic years:', error);
        res.status(500).json({ error: 'An error occurred while fetching academic years' });
    }
};

// @desc    Get all semesters for an academic year
// @route   GET /api/curriculum/semesters/:yearId
// @access  Private
const getSemesters = async (req, res) => {
    const { yearId } = req.params;
    try {
        const semesters = await prisma.semester.findMany({
            where: {
                academicYearId: yearId,
            },
            orderBy: {
                startDate: 'asc',
            },
        });
        res.json(semesters);
    } catch (error) {
        console.error('Error fetching semesters:', error);
        res.status(500).json({ error: 'An error occurred while fetching semesters' });
    }
};

module.exports = {
    getAcademicYears,
    getSemesters,
};