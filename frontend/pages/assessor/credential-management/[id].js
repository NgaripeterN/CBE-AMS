import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../../lib/api';
import { getCourse, getAllModulesForLead, getModulesForCourse } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';

const CredentialManagement = () => {
  const router = useRouter();
  const { id } = router.query;
  const [course, setCourse] = useState(null);
  const [allModules, setAllModules] = useState([]);
  const [courseModules, setCourseModules] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (id && user) {
      const fetchCourseData = async () => {
        try {
          const courseData = await getCourse(id);
          setCourse(courseData);
          const courseModulesData = await getModulesForCourse(id, user.role);
          setCourseModules(courseModulesData);
          const allModulesData = await getAllModulesForLead();
          setAllModules(allModulesData);
        } catch (err) {
          setError('Failed to fetch course data.');
        }
      };
      fetchCourseData();
    }
  }, [id, user]);

  useEffect(() => {
    if (allModules.length > 0) {
      const courseModuleIds = courseModules.map(m => m.module_id);
      setAvailableModules(allModules.filter(m => !courseModuleIds.includes(m.module_id)));
    }
  }, [allModules, courseModules]);

  const handleAddModule = (module) => {
    setCourseModules([...courseModules, module]);
    setAvailableModules(availableModules.filter(m => m.module_id !== module.module_id));
  };

  const handleRemoveModule = (module) => {
    setAvailableModules([...availableModules, module]);
    setCourseModules(courseModules.filter(m => m.module_id !== module.module_id));
  };

  const handleSaveChanges = async () => {
    try {
      await api.put(`/lead/courses/${id}/modules`, { module_ids: courseModules.map(m => m.module_id) });
      setSuccess('Course modules updated successfully!');
    } catch (err) {
      setError('Failed to update course modules.');
    }
  };

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  if (!course) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-foreground">Set Stackable Credential Modules for {course.name}</h1>
      {success && <p className="text-green-500 bg-green-500/20 p-3 rounded-md mb-4">{success}</p>}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Course Details</h2>
        <p><span className="font-bold">Course Code:</span> {course.courseCode}</p>
        <p><span className="font-bold">Description:</span> {course.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Modules in this Credential</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            {courseModules.map(module => (
              <div key={module.module_id} className="flex items-center justify-between p-2 border-b dark:border-gray-700">
                <span>{module.title}</span>
                <button onClick={() => handleRemoveModule(module)} className="text-red-500 hover:text-red-700">Remove</button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Available Modules</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            {availableModules.map(module => (
              <div key={module.module_id} className="flex items-center justify-between p-2 border-b dark:border-gray-700">
                <span>{module.title}</span>
                <button onClick={() => handleAddModule(module)} className="text-green-500 hover:text-green-700">Add</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8">
        <button onClick={handleSaveChanges} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg">Save Changes</button>
      </div>
    </div>
  );
};

export default CredentialManagement;