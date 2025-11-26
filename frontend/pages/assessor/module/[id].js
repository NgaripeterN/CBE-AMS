import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getModule, getOfferingByModule } from '../../../lib/api';

const ModuleDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [module, setModule] = useState(null);
  const [offering, setOffering] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModule = async () => {
      if (id) {
        try {
          setLoading(true);
          const moduleData = await getModule(id);
          setModule(moduleData);
          const offeringData = await getOfferingByModule(id);
          setOffering(offeringData);
          setError(null);
        } catch (err) {
          setError(err.message || 'An error occurred while fetching the module.');
          setModule(null);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchModule();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  if (!module) {
    return <p className="text-center">Module not found.</p>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900">{module.title}</h1>
              <p className="text-lg text-gray-500 mt-1">{module.moduleCode}</p>
            </div>
            <Link href="/assessor/my-modules" legacyBehavior>
              <a className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out">
                &larr; Back to Modules
              </a>
            </Link>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-lg text-gray-900">{module.description || 'N/A'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-lg">
                  <span className={`px-3 py-1 font-semibold rounded-full ${module.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {module.status}
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Version</dt>
                <dd className="mt-1 text-lg text-gray-900">{module.version || 'N/A'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-lg text-gray-900">{new Date(module.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Module Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href={`/assessor/enroll-student?offeringId=${offering.id}`} legacyBehavior>
                <a className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out text-center">
                  Enroll Student
                </a>
              </Link>
              <Link href={`/assessor/create-assessment?module_id=${id}`} legacyBehavior>
                <a className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out text-center">
                  Create Assessment
                </a>
              </Link>
              <Link href={`/assessor/grade-submissions?module_id=${id}`} legacyBehavior>
                <a className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out text-center">
                  Grade Submissions
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleDetailsPage;
