import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../../lib/api';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';

const SubmissionDetails = () => {
  const router = useRouter();
  const { id } = router.query;

  const [submission, setSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (id) {
        try {
          const { data } = await api.get(`/student/submission/${id}`);
          setSubmission(data);
        } catch (err) {
          setError('Failed to fetch submission details.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchSubmission();
  }, [id]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (!submission) {
    return <div className="text-center">Submission not found.</div>;
  }
  
  const { totalScore, maxScore } = submission;

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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{submission.assessment.title}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Submitted on: {new Date(submission.createdAt).toLocaleString()}</p>
        </div>

        <div className="p-6">
          {submission.gradedAt && submission.grade ? (
            <>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Grade</h2>
                <p className={`text-3xl font-bold ${totalScore / maxScore >= 0.5 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalScore} / {maxScore}
                </p>
              </div>

              {submission.grade.notes && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Assessor&apos;s Notes</h3>
                  <div className="prose max-w-none text-gray-700 dark:text-gray-300">
                    {submission.grade.notes}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Graded Rubric</h3>
                <div className="space-y-6">
                  {(submission.assessment.rubric?.questions || []).map((question, index) => {
                    const studentAnswer = submission.data.answers[index];
                    const gradedScore = submission.grade.questionScores.find(s => s.questionIndex === index);
                    const isCorrect = gradedScore && gradedScore.score === question.marks;

                    return (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-gray-800 dark:text-white">Question {index + 1}</h4>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Max Marks: {question.marks}</span>
                        </div>
                        <div className="prose max-w-none text-gray-700 dark:text-gray-300 mb-4">{question.text}</div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-semibold text-gray-800 dark:text-white mb-2">Your Answer</h5>
                            <div className="prose max-w-none text-gray-700 dark:text-gray-300">
                              {typeof studentAnswer === 'object' && studentAnswer !== null ? (
                                <a href={studentAnswer.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  View Uploaded File
                                </a>
                              ) : (
                                studentAnswer
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h5 className="font-semibold text-gray-800 dark:text-white mb-2">Score</h5>
                            <div className="flex items-center">
                              <p className={`text-2xl font-bold ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                {gradedScore ? gradedScore.score : 'N/A'}
                              </p>
                              {gradedScore && (isCorrect ? <FiCheckCircle className="ml-2 text-green-500" /> : <FiXCircle className="ml-2 text-red-500" />)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Pending Review</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">This submission is awaiting review by your assessor.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetails;
