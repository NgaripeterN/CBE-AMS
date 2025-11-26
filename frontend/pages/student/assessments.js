import { useState, useEffect } from 'react';
import api from '../../lib/api';
import Link from 'next/link';
import { DocumentTextIcon, ClockIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/router';

const AssessmentsPage = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const { data } = await api.get('/student/assessments');
        setAssessments(data);
      } catch (err) {
        setError('Failed to load assessments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, []);

  const getStatus = (assessment) => {
    if (assessment.submissions && assessment.submissions.length > 0) {
      const latestSubmission = assessment.submissions[0];
      if (latestSubmission.grade) {
        return { text: 'Graded', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900', icon: <CheckCircleIcon className="h-5 w-5" /> };
      }
      return { text: 'Submitted', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900', icon: <ArrowPathIcon className="h-5 w-5" /> };
    }
    if (new Date(assessment.deadline) < new Date()) {
      return { text: 'Overdue', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900', icon: <ClockIcon className="h-5 w-5" /> };
    }
    return { text: 'Not Submitted', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700', icon: <DocumentTextIcon className="h-5 w-5" /> };
  };

  const goBack = () => {
    router.back();
  };

  if (loading) {
    return <div className="text-center mt-10">Loading assessments...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
            <button
                onClick={goBack}
                className="inline-flex items-center mb-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back
            </button>
          <h1 className="text-4xl font-bold tracking-tight text-gray-800 dark:text-white sm:text-5xl">
            My Assessments
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Here you can find all your assigned assessments, their status, and deadlines.
          </p>
        </header>

        {assessments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {assessments.map((assessment) => {
              const status = getStatus(assessment);
              return (
                <Link href={`/student/assessments/${assessment.assessment_id}`} key={assessment.assessment_id}>
                  <a className="block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider">
                          {assessment.module.title}
                        </p>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-2">
                          {assessment.title}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Created by: <span className="font-semibold">{assessment.createdBy.user.name}</span>
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${status.color} ${status.bgColor}`}>
                        {status.icon}
                        <span className="ml-2">{status.text}</span>
                      </span>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Due: <span className="font-semibold">{new Date(assessment.deadline).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </a>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white">No Assessments Found</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              You have no assessments assigned at this time. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentsPage;
