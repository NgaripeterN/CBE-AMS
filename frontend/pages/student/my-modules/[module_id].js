import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../../lib/api';
import Link from 'next/link';
import { ArrowLeftIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

const ModulePage = () => {
  const router = useRouter();
  const { module_id } = router.query;
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (module_id) {
      const fetchModule = async () => {
        try {
          const { data } = await api.get(`/student/my-modules/${module_id}`);
          setModule(data);
        } catch (err) {
          setError('Failed to load module details.');
        } finally {
          setLoading(false);
        }
      };
      fetchModule();
    }
  }, [module_id]);

  const goBack = () => {
    router.back();
  };

  if (loading) {
    return <div className="text-center mt-10">Loading module...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  }

  if (!module) {
    return <div className="text-center mt-10">Module not found.</div>;
  }

  const pendingAssessments = module.assessments.filter(assessment => !assessment.submission);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={goBack}
        className="inline-flex items-center mb-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back
      </button>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{module.title}</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6">{module.moduleCode}</p>

      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Pending Assessments</h2>
      <div className="space-y-4">
        {pendingAssessments.length > 0 ? (
          pendingAssessments.map(assessment => (
            <div key={assessment.assessment_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{assessment.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Created by: {assessment.createdBy.user.name}</p>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Deadline: {new Date(assessment.deadline).toLocaleString()}</p>
              </div>
              <div className="flex items-center">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800`}>
                  Pending
                </span>
                <Link href={`/student/assessments/${assessment.assessment_id}`} legacyBehavior>
                  <a className="ml-4 px-4 py-2 bg-primary text-primary-foreground rounded-md">View</a>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p>No pending assessments found for this module.</p>
        )}
      </div>
    </div>
  );
};

export default ModulePage;
