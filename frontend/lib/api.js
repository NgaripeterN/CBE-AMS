import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (credentials) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getCourses = async (searchQuery = '', page = 1, limit = 10) => {
  try {
    const { data } = await api.get(`/admin/courses?search=${searchQuery}&page=${page}&limit=${limit}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getCourse = async (id) => {
  try {
    const { data } = await api.get(`/admin/courses/${id}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getLeadCourse = async () => {
  try {
    const { data } = await api.get('/lead/my-course');
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const createCourse = async (courseData) => {
  try {
    const { data } = await api.post('/admin/courses', courseData);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const updateCourse = async (id, courseData) => {
  try {
    const { data } = await api.put(`/admin/courses/${id}`, courseData);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const deleteCourse = async (id) => {
  try {
    const { data } = await api.delete(`/admin/courses/${id}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getModules = async (searchQuery = '', page = 1, limit = 10) => {
  try {
    const { data } = await api.get(`/admin/modules?search=${searchQuery}&page=${page}&limit=${limit}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getAllModulesForLead = async () => {
  try {
    const { data } = await api.get('/lead/modules');
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getModule = async (id) => {
  try {
    const { data } = await api.get(`/modules/${id}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getOfferingByModule = async (moduleId) => {
  try {
    const { data } = await api.get(`/assessor/modules/${moduleId}/offering`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const createModule = async (moduleData) => {
  try {
    const { data } = await api.post('/admin/modules', moduleData);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const updateModule = async (id, moduleData) => {
  try {
    const { data } = await api.put(`/lead/modules/${id}`, moduleData);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const deleteModule = async (id) => {
  try {
    const { data } = await api.delete(`/lead/modules/${id}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getAssessors = async (searchQuery = '', page = 1, limit = 10) => {
  try {
    const { data } = await api.get(`/admin/assessors?search=${searchQuery}&page=${page}&limit=${limit}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getAssessorCourses = async () => {
  try {
    const { data } = await api.get('/assessor/courses');
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getAssessorModules = async (tab = 'active', page = 1, courseId = 'all') => {
  try {
    const { data } = await api.get(`/assessor/modules?tab=${tab}&page=${page}&courseId=${courseId}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getAllAssessorsForLead = async (page = 1, limit = 10, search = '') => {
  try {
    const { data } = await api.get(`/lead/assessors?page=${page}&limit=${limit}&search=${search}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getModulesForCourse = async (courseId, page = 1, limit = 10, searchQuery = '') => {
  try {
    const { data } = await api.get(`/admin/courses/${courseId}/modules?page=${page}&limit=${limit}&search=${searchQuery}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getModulesForCourseByLead = async (courseId, page = 1, limit = 10, searchQuery = '') => {
  try {
    const { data } = await api.get(`/lead/courses/${courseId}/modules?page=${page}&limit=${limit}&search=${searchQuery}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getAssessorsForCourse = async (courseId) => {
  try {
    const { data } = await api.get(`/lead/courses/${courseId}/assessors`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};


export const assignAssessorsToModule = async (moduleId, assessorIds) => {
  try {
    const { data } = await api.post('/lead/assign-assessors-to-module', {
      module_id: moduleId,
      assessor_ids: assessorIds,
    });
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const unassignAssessor = async (moduleId, assessorId) => {
  try {
    const { data } = await api.post('/lead/unassign-assessor', { moduleId, assessorId });
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getAssignedAssessors = async (moduleId) => {
  try {
    const { data } = await api.get(`/modules/${moduleId}/assessors`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};


export const createAssessor = async (assessorData) => {
  try {
    const { data } = await api.post('/admin/create-assessor', assessorData);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const updateAssessor = async (id, assessorData) => {
  try {
    const { data } = await api.put(`/admin/users/${id}`, assessorData);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const deleteAssessor = async (id) => {
  try {
    const { data } = await api.delete(`/admin/users/${id}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getStudents = async (searchQuery = '', page = 1, limit = 10) => {
  try {
    const { data } = await api.get(`/admin/students?search=${searchQuery}&page=${page}&limit=${limit}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const createStudent = async (studentData) => {
  try {
    const { data } = await api.post('/admin/create-student', studentData);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const updateStudent = async (id, studentData) => {
  try {
    const { data } = await api.put(`/admin/users/${id}`, studentData);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const deleteStudent = async (id) => {
  try {
    const { data } = await api.delete(`/admin/users/${id}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const assignLeadToCourse = async (course_id, assessor_id) => {
  try {
    const { data } = await api.post('/admin/assign-lead-to-course', { course_id, assessor_id });
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getCourseLeads = async (page = 1, limit = 10) => {
  try {
    const { data } = await api.get(`/admin/course-leads?page=${page}&limit=${limit}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getCredentialTrackingData = async () => {
  try {
    const { data } = await api.get('/assessor/credential-tracking');
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getStudentProgressData = async (page = 1, moduleId = '', studentId = '') => {
  try {
    const { data } = await api.get(`/assessor/student-progress?page=${page}&moduleId=${moduleId}&studentId=${studentId}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getRandomSubmission = async () => {
  try {
    const { data } = await api.get('/assessor/dashboard/random-submission');
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

// @desc    Get all assessments for a student
// @access  Private/Student
export const getAssessments = async () => {
    const { data } = await api.get('/student/assessments');
    return data;
};

// @desc    Get all submissions for a student
// @access  Private/Student
export const getStudentSubmissions = async () => {
    const { data } = await api.get('/student/submissions');
    return data;
};

// @desc    Get all observations for a student
// @access  Private/Student
export const getStudentObservations = async () => {
    const { data } = await api.get('/student/my-observations');
    return data;
};

// @desc    Get a single assessment by ID
// @access  Private/Student
export const getAssessmentById = async (assessmentId) => {
  try {
    const { data } = await api.get(`/student/assessments/${assessmentId}`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const submitAssessment = async (assessmentId, submissionData) => {
  try {
    const { data } = await api.post(`/student/submit/${assessmentId}`, submissionData);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const generateUploadSignature = async (folder) => {
  try {
    const { data } = await api.post('/student/generate-upload-signature', { folder });
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const migrateStudents = async (moduleId, oldAssessorId, newAssessorId) => {
  try {
    const { data } = await api.post('/lead/migrate-students', { moduleId, oldAssessorId, newAssessorId });
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getSubmissionMediaUrl = async (submissionId, questionIndex) => {
  try {
    const { data } = await api.get(`/assessor/submissions/${submissionId}/media/${questionIndex}/url`);
    return data.url;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export const getOfferingPerformance = async (courseId, semesterId) => {
  try {
    const { data } = await api.get(`/lead/courses/${courseId}/offerings/${semesterId}/stats`);
    return data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network Error');
    }
  }
};

export default api;