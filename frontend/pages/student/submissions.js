import { useState, useEffect } from 'react';
import api from '../../lib/api';
import Link from 'next/link';
import { DocumentTextIcon, AcademicCapIcon, CheckCircleIcon, ClockIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const SubmissionsPage = () => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const { data } = await api.get(`/student/submissions?time=${new Date().getTime()}`);
        const formattedData = data.map(item => {
          if (item.type === 'submission' && typeof item.assessment.rubric === 'string') {
            try {
              item.assessment.rubric = JSON.parse(item.assessment.rubric);
            } catch (e) {
              console.error('Failed to parse rubric', e);
            }
          }
          if (item.type === 'submission' && typeof item.grade === 'string') {
            try {
              item.grade = JSON.parse(item.grade);
            } catch (e) {
              console.error('Failed to parse grade', e);
            }
          }
          return item;
        });
        setFeed(formattedData);
      } catch (err) {
        setError('Failed to load submissions and observations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const toggle = (id) => {
    setExpanded(prevState => ({
      ...prevState,
      [id]: !prevState[id]
    }));
  };

  if (loading) {
    return <div className="text-center mt-10">Loading feed...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  }

  const groupedFeed = feed.reduce((acc, item) => {
    const moduleInfo = item.type === 'submission' ? item.assessment.module : item.module;
    if (!moduleInfo.offerings || moduleInfo.offerings.length === 0) return acc;
    
    const offering = moduleInfo.offerings[0];
    const semester = offering.semester;
    const academicYear = semester.academicYear;

    if (!acc[academicYear.name]) {
      acc[academicYear.name] = {};
    }
    if (!acc[academicYear.name][semester.name]) {
      acc[academicYear.name][semester.name] = {};
    }
    if (!acc[academicYear.name][semester.name][moduleInfo.title]) {
      acc[academicYear.name][semester.name][moduleInfo.title] = [];
    }
    acc[academicYear.name][semester.name][moduleInfo.title].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-800 dark:text-white sm:text-5xl">
            My Submissions & Observations
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Review your submitted assessments and recorded observations.
          </p>
        </header>

        {Object.keys(groupedFeed).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedFeed).map(([year, semesters]) => (
              <div key={year} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <button
                  onClick={() => toggle(year)}
                  className="flex items-center justify-between w-full text-left text-3xl font-bold text-gray-800 dark:text-white group"
                >
                  <span>{year}</span>
                  <ChevronDownIcon className={`h-6 w-6 transform transition-transform group-hover:text-primary ${expanded[year] ? 'rotate-180' : ''}`} />
                </button>
                {expanded[year] && (
                  <div className="mt-4 space-y-4">
                    {Object.entries(semesters).map(([semester, modules]) => (
                      <div key={semester} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <button
                          onClick={() => toggle(`${year}-${semester}`)}
                          className="flex items-center justify-between w-full text-left text-2xl font-bold text-gray-800 dark:text-white group"
                        >
                          <span>{semester}</span>
                          <ChevronDownIcon className={`h-6 w-6 transform transition-transform group-hover:text-primary ${expanded[`${year}-${semester}`] ? 'rotate-180' : ''}`} />
                        </button>
                        {expanded[`${year}-${semester}`] && (
                          <div className="mt-4 space-y-4">
                            {Object.entries(modules).map(([moduleTitle, items]) => (
                              <div key={moduleTitle} className="bg-gray-100 dark:bg-gray-600 rounded-lg p-4">
                                <button
                                  onClick={() => toggle(`${year}-${semester}-${moduleTitle}`)}
                                  className="flex items-center justify-between w-full text-left text-xl font-bold text-gray-800 dark:text-white group"
                                >
                                  <span>{moduleTitle}</span>
                                  <ChevronDownIcon className={`h-6 w-6 transform transition-transform group-hover:text-primary ${expanded[`${year}-${semester}-${moduleTitle}`] ? 'rotate-180' : ''}`} />
                                </button>
                                {expanded[`${year}-${semester}-${moduleTitle}`] && (
                                  <div className="mt-4 space-y-4">
                                    {items.map((item) => (
                                      <div key={item.type === 'submission' ? item.submission_id : item.id} className="bg-white dark:bg-gray-500 rounded-lg p-4">
                                        {item.type === 'submission' ? (
                                          <>
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center">
                                                <DocumentTextIcon className="h-8 w-8 text-primary mr-3" />
                                                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                                                  {item.assessment.title}
                                                </h2>
                                              </div>
                                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${item.gradedAt ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                                                {item.gradedAt ? <CheckCircleIcon className="h-4 w-4 mr-1" /> : <ClockIcon className="h-4 w-4 mr-1" />}
                                                {item.gradedAt ? 'Graded' : 'Pending'}
                                              </span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                              Submitted on: {new Date(item.createdAt).toLocaleString()}
                                            </p>
                                            {item.grade && item.grade.questionScores && (
                                              <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                                                <strong>Grade:</strong> {(() => {
                                                  const totalScore = item.grade.questionScores.reduce((acc, qs) => acc + qs.score, 0);
                                                  const totalPossibleMarks = item.assessment.rubric.questions.reduce((acc, q) => acc + q.marks, 0);
                                                  const percentage = totalPossibleMarks > 0 ? (totalScore / totalPossibleMarks) * 100 : 0;
                                                  return `${totalScore} / ${totalPossibleMarks} (${percentage.toFixed(0)}%)`;
                                                })()}
                                              </p>
                                            )}
                                            <div className="mt-4 text-right">
                                              <Link href={`/student/submissions/${item.submission_id}`} legacyBehavior>
                                                <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                                                  View Submission
                                                </a>
                                              </Link>
                                            </div>
                                          </>
                                        ) : (
                                          <>
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center">
                                                <AcademicCapIcon className="h-8 w-8 text-primary mr-3" />
                                                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                                                  Observation
                                                </h2>
                                              </div>
                                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
                                                <CheckCircleIcon className="h-4 w-4 mr-1" /> Recorded
                                              </span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                              Assessor: <span className="font-semibold">{item.assessor.user.name}</span>
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                              Recorded on: {new Date(item.recordedAt).toLocaleString()}
                                            </p>
                                            <div className="mt-4 text-right">
                                              <Link href={`/student/observations/${item.id}`} legacyBehavior>
                                                <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                                                  View Observation
                                                </a>
                                              </Link>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white">No Activity Found</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              You have no submissions or observations at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionsPage;