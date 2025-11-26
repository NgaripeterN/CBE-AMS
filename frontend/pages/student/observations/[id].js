import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../../lib/api';
import { ClockIcon } from '@heroicons/react/24/outline';

const ObservationDetails = () => {
  const router = useRouter();
  const { id } = router.query;

  const [observation, setObservation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchObservation = async () => {
      if (id) {
        try {
          const { data } = await api.get(`/student/observations/${id}`);
          setObservation(data);
        } catch (err) {
          setError('Failed to fetch observation details.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchObservation();
  }, [id]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (!observation) {
    return <div className="text-center">Observation not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        &larr; Back to Submissions
      </button>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Observation Details</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Module: {observation.module.title}</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Assessor&#39;s Notes</h3>
              <div className="prose max-w-none text-gray-700 dark:text-gray-300">
                {observation.notes || 'N/A'}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Details</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Recorded by: <span className="font-semibold">{observation.assessor.user.name}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <ClockIcon className="h-4 w-4 inline-block mr-1" />
                {new Date(observation.recordedAt).toLocaleString()}
              </p>
              {observation.numericScore && observation.maxScore && (
                <p className="text-lg font-bold text-gray-800 dark:text-white mt-2">
                  Score: {observation.numericScore} / {observation.maxScore}
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span className="font-semibold">Competencies:</span> {observation.competencyTags.join(', ') || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObservationDetails;
