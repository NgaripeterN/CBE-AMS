const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

// @desc    Get key stats for the admin dashboard
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const [studentCount, courseCount, assessorCount] = await prisma.$transaction([
      prisma.student.count(),
      prisma.course.count(),
      prisma.assessor.count(),
    ]);

    res.json({ studentCount, courseCount, assessorCount });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'An error occurred while fetching dashboard stats' });
  }
};

// @desc    Create a new assessor
// @route   POST /api/admin/create-assessor
// @access  Private/Admin
const createAssessor = async (req, res) => {
  const { name, email, department, tempPassword } = req.body;

  if (!name || !email || !department || !tempPassword) {
    return res.status(400).json({ error: 'Please provide name, email, department, and temporary password' });
  }

  const passwordHash = await bcrypt.hash(tempPassword, 10);
  try {
    const user = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'ASSESSOR',
          department,
          status: 'PENDING_PASSWORD_CHANGE',
        },
      });

      await prisma.assessor.create({
        data: {
          userId: newUser.user_id,
        },
      });

      return newUser;
    });

    res.status(201).json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'User with this email or registration number already exists' });
    }
    res.status(500).json({ error: 'An error occurred while creating the assessor' });
  }
};

// @desc    Create a new student
// @route   POST /api/admin/create-student
// @access  Private/Admin
const createStudent = async (req, res) => {
  const { name, email, regNumber, program } = req.body;

  if (!name || !email || !regNumber || !program) {
    return res.status(400).json({ error: 'Name, email, registration number, and program are required' });
  }

  const passwordHash = await bcrypt.hash(regNumber, 10);
  try {
    const user = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'STUDENT',
          regNumber,
          program,
          status: 'PENDING_PASSWORD_CHANGE',
        },
      });

      await prisma.student.create({
        data: {
          userId: newUser.user_id,
        },
      });

      return newUser;
    });

    res.status(201).json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'User with this email or registration number already exists' });
    }
    res.status(500).json({ error: 'An error occurred while creating the student' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  const { role } = req.query;
  const where = {
    role: {
      not: 'ADMIN',
    },
  };
  if (role) {
    where.role = role;
  }
  try {
    const users = await prisma.user.findMany({
      where,
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'An error occurred while fetching users' });
  }
};

// @desc    Update a user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, department, regNumber, program } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { user_id: id } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'STUDENT' && !program) {
      return res.status(400).json({ error: 'Program cannot be empty for a student.' });
    }
    
    const dataToUpdate = {
        email,
        name,
        department,
    };

    if (user.role === 'STUDENT') {
        if (regNumber) dataToUpdate.regNumber = regNumber;
        if (program) dataToUpdate.program = program;
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: id },
      data: dataToUpdate,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the user' });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.findUnique({ where: { user_id: id } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.role === 'ASSESSOR') {
        const assessor = await prisma.assessor.findUnique({ where: { userId: id } });
        if (assessor) {
          await prisma.courseAssignment.deleteMany({ where: { assessorId: assessor.id } });
          await prisma.offeringAssignment.deleteMany({ where: { assessorId: assessor.id } });
          await prisma.observation.deleteMany({ where: { assessor_id: assessor.id } });
          await prisma.announcement.deleteMany({ where: { assessorId: assessor.id } });
          await prisma.assessor.delete({ where: { userId: id } });
        }
      } else if (user.role === 'STUDENT') {
        const student = await prisma.student.findUnique({ where: { userId: id } });
        if (student) {
          await prisma.enrollment.deleteMany({ where: { student_id: student.id } });
          await prisma.submission.deleteMany({ where: { student_id: student.id } });
          await prisma.microCredential.deleteMany({ where: { student_id: student.id } });
          await prisma.courseCredential.deleteMany({ where: { student_id: student.id } });
          await prisma.studentCompetencyEvidence.deleteMany({ where: { studentId: student.id } });
          await prisma.studentsOnObservations.deleteMany({ where: { studentId: student.id } });
          await prisma.student.delete({ where: { userId: id } });
        }
      }

      await prisma.notification.deleteMany({ where: { userId: id } });
      await prisma.user.delete({ where: { user_id: id } });
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'An error occurred while deleting the user' });
  }
};

// @desc    Import users from CSV
// @route   POST /api/admin/import-users
// @access  Private/Admin
const importUsers = async (req, res) => {
  const { users, defaultProgram } = req.body;
  let createdCount = 0;
  let duplicateCount = 0;
  const errors = [];
  const createdUsers = [];

  for (const userData of users) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        duplicateCount++;
        continue;
      }

      const isStudent = userData.role.toUpperCase() === 'STUDENT';
      let program = isStudent ? userData.program || defaultProgram : null;

      if (isStudent) {
        if (!program) {
          errors.push({ email: userData.email, error: 'Program is required for students and no default was set.' });
          continue;
        }

        const course = await prisma.course.findFirst({
          where: {
            name: {
              equals: program,
              mode: 'insensitive',
            },
          },
        });

        if (!course) {
          errors.push({ email: userData.email, error: `Program '${program}' not found.` });
          continue;
        }
        
        program = course.name; // Use the exact name from the database

        if (!userData.regNumber) {
          errors.push({ email: userData.email, error: 'Registration number (regNumber) is required for students.' });
          continue;
        }
      }

      const password = isStudent ? userData.regNumber : (userData.password || Math.random().toString(36).slice(-8));
      const passwordHash = await bcrypt.hash(password, 10);
      const name = `${userData.firstName} ${userData.lastName}`;

      const newUser = await prisma.$transaction(async (prisma) => {
        const user = await prisma.user.create({
          data: {
            name,
            email: userData.email,
            passwordHash,
            role: userData.role.toUpperCase(),
            status: 'PENDING_PASSWORD_CHANGE',
            ...(isStudent && { regNumber: userData.regNumber, program: program }),
            ...(userData.role.toUpperCase() === 'ASSESSOR' && { department: userData.department }),
          },
        });

        if (isStudent) {
          await prisma.student.create({
            data: {
              userId: user.user_id,
            },
          });
        } else if (userData.role.toUpperCase() === 'ASSESSOR') {
          await prisma.assessor.create({
            data: {
              userId: user.user_id,
            },
          });
        }
        return user;
      });

      createdCount++;
      createdUsers.push({ email: newUser.email, password });
    } catch (error) {
      errors.push({ email: userData.email, error: error.message });
    }
  }

  res.status(201).json({
    message: 'Users imported successfully',
    created: createdCount,
    duplicates: duplicateCount,
    errors,
    createdUsers,
  });
};

// @desc    Import courses from CSV
// @route   POST /api/admin/import-courses
// @access  Private/Admin
const importCourses = async (req, res) => {
  const { courses } = req.body;
  let createdCount = 0;
  let duplicateCount = 0;
  const errors = [];
  const createdCourses = [];

  for (const courseData of courses) {
    try {
      const existingCourse = await prisma.course.findUnique({
        where: { code: courseData.code },
      });

      if (existingCourse) {
        duplicateCount++;
        continue;
      }

      if (!courseData.name || !courseData.code) {
        errors.push({ name: courseData.name, code: courseData.code, error: 'Name and code are required.' });
        continue;
      }

      const newCourse = await prisma.course.create({
        data: {
          name: courseData.name,
          code: courseData.code,
          category: courseData.category,
          description: courseData.description,
          createdBy: req.user.userId,
        },
      });

      createdCount++;
      createdCourses.push(newCourse);
    } catch (error) {
      errors.push({ name: courseData.name, code: courseData.code, error: error.message });
    }
  }

  res.status(201).json({
    message: 'Courses imported successfully',
    created: createdCount,
    duplicates: duplicateCount,
    errors,
    createdCourses,
  });
};

// @desc    Get all courses
// @route   GET /api/admin/courses
// @access  Private/Admin
const getCourses = async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  const where = {};
  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        code: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  try {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const courses = await prisma.course.findMany({
      where,
      skip,
      take: limitNum,
    });

    const total = await prisma.course.count({ where });

    res.json({
      data: courses,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching courses' });
  }
};

// @desc    Get a course by ID
// @route   GET /api/admin/courses/:id
// @access  Private/Admin
const getCourseById = async (req, res) => {
  const { id } = req.params;
  try {
    const course = await prisma.course.findUnique({
      where: { course_id: id },
      include: { competencies: true },
    });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the course' });
  }
};

// @desc    Create a new course
// @route   POST /api/admin/courses
// @access  Private/Admin
const createCourse = async (req, res) => {
  const { name, code, category, description } = req.body;

  if (!name || !code) {
    return res.status(400).json({ error: 'Name and code are required' });
  }

  try {
    const course = await prisma.course.create({
      data: {
        name,
        code,
        category,
        description,
        createdBy: req.user.userId,
      },
    });
    res.status(201).json(course);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Course with this code already exists' });
    }
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'An error occurred while creating the course' });
  }
};

// @desc    Approve a course
// @route   POST /api/admin/approve-course/:id
// @access  Private/Admin
const approveCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const course = await prisma.course.update({
      where: { course_id: id },
      data: { approved: true },
    });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while approving the course' });
  }
};

// @desc    Update a course
// @route   PUT /api/admin/courses/:id
// @access  Private/Admin
const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { name, code, category, description } = req.body;
  try {
    const course = await prisma.course.update({
      where: { course_id: id },
      data: {
        name,
        code,
        category,
        description,
      },
    });
    res.json(course);
  } catch (error) {
    if (error.code === 'P2002') {
        return res.status(400).json({ error: 'A course with this code already exists.' });
    }
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'An error occurred while updating the course' });
  }
};

// @desc    Delete a course
// @route   DELETE /api/admin/courses/:id
// @access  Private/Admin
const deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      // Handle academic structure deletion first
      const academicYears = await tx.academicYear.findMany({
        where: { courseId: id },
        select: { id: true },
      });

      if (academicYears.length > 0) {
        const academicYearIds = academicYears.map(ay => ay.id);
        
        const semesters = await tx.semester.findMany({
          where: { academicYearId: { in: academicYearIds } },
          select: { id: true },
        });

        if (semesters.length > 0) {
          const semesterIds = semesters.map(s => s.id);
          
          const offerings = await tx.offering.findMany({
            where: { semesterId: { in: semesterIds } },
            select: { id: true },
          });

          if (offerings.length > 0) {
            const offeringIds = offerings.map(o => o.id);
            await tx.offeringAssignment.deleteMany({ where: { offeringId: { in: offeringIds } } });
          }
          
          await tx.offering.deleteMany({ where: { semesterId: { in: semesterIds } } });
        }
        
        await tx.semester.deleteMany({ where: { academicYearId: { in: academicYearIds } } });
      }

      await tx.academicYear.deleteMany({ where: { courseId: id } });

      // Existing module-based deletion logic
      const modules = await tx.module.findMany({
        where: { course_id: id },
        select: { module_id: true },
      });
      const moduleIds = modules.map((m) => m.module_id);

      if (moduleIds.length > 0) {
        // Delete enrollments associated with these modules
        await tx.enrollment.deleteMany({ where: { module_id: { in: moduleIds } } });

        // Offerings linked to modules but not semesters (if any)
        await tx.offering.deleteMany({ where: { moduleId: { in: moduleIds } } });
        
        const assessments = await tx.assessment.findMany({
          where: { module_id: { in: moduleIds } },
          select: { assessment_id: true },
        });
        const assessmentIds = assessments.map((a) => a.assessment_id);

        if (assessmentIds.length > 0) {
          await tx.submission.deleteMany({
            where: { assessment_id: { in: assessmentIds } },
          });
        }

        await tx.assessment.deleteMany({
          where: { module_id: { in: moduleIds } },
        });

        await tx.observation.deleteMany({
          where: { module_id: { in: moduleIds } },
        });

        await tx.microCredential.deleteMany({
          where: { module_id: { in: moduleIds } },
        });

        await tx.announcement.deleteMany({
          where: { moduleId: { in: moduleIds } },
        });

        await tx.module.deleteMany({
          where: { module_id: { in: moduleIds } },
        });
      }

      await tx.courseCredential.deleteMany({ where: { course_id: id } });
      await tx.courseAssignment.deleteMany({ where: { courseId: id } });

      await tx.course.delete({ where: { course_id: id } });
    });

    res.json({ message: 'Course and all related records deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'An error occurred while deleting the course' });
  }
};


// @desc    Get all assessors
// @route   GET /api/admin/assessors
// @access  Private/Admin
const getAssessors = async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  const where = {};
  if (search) {
    where.user = {
      OR: [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ],
    };
  }

  try {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const assessors = await prisma.assessor.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        user: {
          select: {
            user_id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    });

    const total = await prisma.assessor.count({ where });

    res.json({
      data: assessors,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching assessors' });
  }
};


// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
const getStudents = async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  const where = {};
  if (search) {
    where.user = {
      OR: [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          regNumber: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ],
    };
  }

  try {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const students = await prisma.student.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        user: {
          select: {
            user_id: true,
            name: true,
            email: true,
            regNumber: true,
            program: true,
          },
        },
      },
    });

    const total = await prisma.student.count({ where });

    res.json({
      data: students,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching students' });
  }
};

// @desc    Create a new module
// @route   POST /api/admin/modules
// @access  Private/Admin
const createModule = async (req, res) => {
  const { course_id, moduleCode, title, description, version, status } = req.body;
  try {
    const module = await prisma.module.create({
      data: {
        course_id,
        moduleCode,
        title,
        description,
        version,
        status,
        createdBy: req.user.userId,
      },
    });
    res.status(201).json(module);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Module with this code already exists for this course' });
    }
    res.status(500).json({ error: 'An error occurred while creating the module' });
  }
};

// @desc    Get all modules
// @route   GET /api/admin/modules
// @access  Private/Admin
const getModules = async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  const where = {};
  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        moduleCode: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  try {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const modules = await prisma.module.findMany({
      where,
      skip,
      take: limitNum,
      include: { course: true },
    });

    const total = await prisma.module.count({ where });

    res.json({
      data: modules,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching modules' });
  }
};

// @desc    Get all modules for a course
// @route   GET /api/admin/courses/:id/modules
// @access  Private/Admin
const getModulesForCourse = async (req, res) => {
  const { id } = req.params;
  const { search, page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const where = { course_id: id };
  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        moduleCode: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  try {
    const modules = await prisma.module.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        competencies: true,
      },
    });

    const total = await prisma.module.count({ where });

    res.json({
      data: modules,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching modules' });
  }
};

// @desc    Update a module
// @route   PUT /api/admin/modules/:moduleId
// @access  Private/Admin
const updateModule = async (req, res) => {
  const { moduleId } = req.params;
  const { name, description } = req.body;
  try {
    const module = await prisma.module.update({
      where: { module_id: moduleId },
      data: { name, description },
    });
    res.json(module);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the module' });
  }
};

// @desc    Delete a module
// @route   DELETE /api/admin/modules/:moduleId
// @access  Private/Admin
const deleteModule = async (req, res) => {
  const { moduleId } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      const offerings = await tx.offering.findMany({
        where: { moduleId: moduleId },
        select: { id: true },
      });
      const offeringIds = offerings.map((o) => o.id);

      if (offeringIds.length > 0) {
        await tx.enrollment.deleteMany({
          where: { offeringId: { in: offeringIds } },
        });
        await tx.offeringAssignment.deleteMany({
          where: { offeringId: { in: offeringIds } },
        });
      }

      await tx.offering.deleteMany({
        where: { moduleId: moduleId },
      });

      const assessments = await tx.assessment.findMany({
        where: { module_id: moduleId },
        select: { assessment_id: true },
      });
      const assessmentIds = assessments.map((a) => a.assessment_id);

      if (assessmentIds.length > 0) {
        await tx.submission.deleteMany({
          where: { assessment_id: { in: assessmentIds } },
        });
      }

      await tx.assessment.deleteMany({
        where: { module_id: moduleId },
      });

      await tx.observation.deleteMany({
        where: { module_id: moduleId },
      });

      await tx.microCredential.deleteMany({
        where: { module_id: moduleId },
      });

      await tx.announcement.deleteMany({
        where: { moduleId: moduleId },
      });

      await tx.module.delete({
        where: { module_id: moduleId },
      });
    });
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the module' });
  }
};

// @desc    Assign an assessor to a course
// @route   POST /api/admin/courses/:courseId/assign-assessor
// @access  Private/Admin
const assignAssessorToCourse = async (req, res) => {
  const { courseId } = req.params;
  const { assessorId } = req.body;

  try {
    const assignment = await prisma.courseAssignment.create({
      data: {
        courseId,
        assessorId,
      },
    });
    res.status(201).json(assignment);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Assignment already exists' });
    }
    res.status(500).json({ error: 'An error occurred while creating the assignment' });
  }
};

// @desc    Assign a lead to a course
// @route   POST /api/admin/assign-lead-to-course
// @access  Private/Admin
const assignLeadToCourse = async (req, res) => {
    const { course_id, assessor_id } = req.body;
    console.log('Assigning lead for course_id:', course_id, 'to assessor_id:', assessor_id);

    if (!course_id || !assessor_id) {
        return res.status(400).json({ error: 'course_id and assessor_id are required' });
    }

    try {
        const existingLeadAssignment = await prisma.courseAssignment.findFirst({
            where: {
                assessorId: assessor_id,
                role: 'LEAD',
                courseId: {
                    not: course_id,
                },
            },
        });

        if (existingLeadAssignment) {
            return res.status(400).json({ error: 'This assessor is already a lead for another course.' });
        }

        const result = await prisma.$transaction(async (prisma) => {
            // Demote previous lead if exists
            await prisma.courseAssignment.updateMany({
                where: {
                    courseId: course_id,
                    role: 'LEAD',
                },
                data: {
                    role: 'GRADER',
                },
            });

            // Upsert new lead
            const newLead = await prisma.courseAssignment.upsert({
                where: {
                    courseId_assessorId: {
                        courseId: course_id,
                        assessorId: assessor_id,
                    },
                },
                update: {
                    role: 'LEAD',
                },
                create: {
                    courseId: course_id,
                    assessorId: assessor_id,
                    role: 'LEAD',
                },
            });

            // Also assign as a grader
            await prisma.courseAssignment.upsert({
                where: {
                    courseId_assessorId: {
                        courseId: course_id,
                        assessorId: assessor_id,
                    },
                },
                update: {},
                create: {
                    courseId: course_id,
                    assessorId: assessor_id,
                    role: 'GRADER',
                },
            });

            // Assign lead to all modules in the course
            const modules = await prisma.module.findMany({
                where: {
                    course_id: course_id,
                },
            });

            for (const module of modules) {
                await prisma.moduleAssignment.upsert({
                    where: {
                        moduleId_assessorId: {
                            moduleId: module.module_id,
                            assessorId: assessor_id,
                        },
                    },
                    update: {},
                    create: {
                        moduleId: module.module_id,
                        assessorId: assessor_id,
                    },
                });
            }

            return newLead;
        });

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while assigning the lead' });
    }
};

// @desc    Assign an assessor to a module
// @route   POST /api/admin/modules/:moduleId/assign-assessor
// @access  Private/Admin
const assignAssessorToModule = async (req, res) => {
  const { moduleId } = req.params;
  const { assessorId } = req.body;

  try {
    const assignment = await prisma.moduleAssignment.create({
      data: {
        moduleId,
        assessorId,
      },
    });
    res.status(201).json(assignment);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Assignment already exists' });
    }
    res.status(500).json({ error: 'An error occurred while creating the assignment' });
  }
};

const getCourseLeads = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    const courseLeads = await prisma.courseAssignment.findMany({
      where: {
        role: 'LEAD',
      },
      skip,
      take: limitNum,
      include: {
        course: {
          select: {
            name: true,
          },
        },
        assessor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.courseAssignment.count({
      where: {
        role: 'LEAD',
      },
    });

    res.json({
      data: courseLeads,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('Error fetching course leads:', error);
    res.status(500).json({ error: 'An error occurred while fetching course leads' });
  }
};

// @desc    Get audit trail for a module
// @route   GET /api/admin/modules/:moduleId/audit
// @access  Admin
const getModuleAuditTrail = async (req, res) => {
  const { moduleId } = req.params;

  try {
    const auditTrail = await prisma.audit.findMany({
      where: {
        entity: 'Module',
        entityId: moduleId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(auditTrail);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the audit trail' });
  }
};

const getDashboardExtendedStats = async (req, res) => {
  try {
    const [activeStudentsCount, credentialsIssuedCount] = await prisma.$transaction([
      prisma.student.count({ where: { enrollments: { some: {} } } }),
      prisma.microCredential.count({ where: { status: 'ISSUED' } }),
    ]);

    const courseCredentialsIssuedCount = await prisma.courseCredential.count({ where: { status: 'ISSUED' } });

    res.json({
      activeStudentsCount,
      credentialsIssuedCount: credentialsIssuedCount + courseCredentialsIssuedCount,
    });
  } catch (error) {
    console.error('Error fetching extended dashboard stats:', error);
    res.status(500).json({ error: 'An error occurred while fetching extended dashboard stats' });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const recentActivity = await prisma.audit.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });
    res.json(recentActivity);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'An error occurred while fetching recent activity' });
  }
};

module.exports = {
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
  getRecentActivity,
};