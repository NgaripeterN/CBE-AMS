import { useState, useEffect } from 'react';
import api from '../../lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

const MyModulesPage = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchModules = async (page, limit) => {
      try {
        const { data } = await api.get(`/student/my-modules?page=${page}&limit=${limit}`);
        setModules(prevModules => [...prevModules, ...data.modules]);
        setHasMore(data.hasMore);
      } catch (err) {
        setError('Failed to load modules.');
      } finally {
        setLoading(false);
      }
    };
    fetchModules(page, limit);
  }, [page, limit]);

  const activeModules = modules.filter(m => !m.completed);
  const completedModules = modules.filter(m => m.completed);

  const groupedCompletedModules = completedModules.reduce((acc, module) => {
    const academicYear = module.academicYear || 'No Academic Year';
    const yearOfStudy = module.yearOfStudy || 'No Year of Study';
    const semester = module.semester || 'No Semester';

    if (!acc[academicYear]) {
      acc[academicYear] = {};
    }
    if (!acc[academicYear][yearOfStudy]) {
      acc[academicYear][yearOfStudy] = {};
    }
    if (!acc[academicYear][yearOfStudy][semester]) {
      acc[academicYear][yearOfStudy][semester] = [];
    }
    acc[academicYear][yearOfStudy][semester].push(module);
    return acc;
  }, {});

  const modulesToShow = activeTab === 'active' ? activeModules : completedModules;

  if (loading && page === 1) {
    return <div className="text-center mt-10">Loading modules...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  }

  const tabVariants = {
    active: { width: '100%' },
    inactive: { width: 0 },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
      },
    }),
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">My Modules</h1>
      </div>

      <div className="mb-8">
        <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
          <TabButton title="Active" activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton title="Completed" activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>

      <AnimatePresence mode='wait'>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'active' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeModules.length > 0 ? (
                activeModules.map((module, i) => (
                  <motion.div
                    key={module.module_id}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.03, boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' }}
                  >
                    <Link href={`/student/my-modules/${module.module_id}`} legacyBehavior>
                      <a className="bg-muted dark:bg-muted rounded-xl shadow-lg dark:shadow-dark-lg overflow-hidden h-full flex flex-col border border-primary/70">
                        <div className="p-6 flex-grow">
                          <div className="flex justify-between items-start">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{module.title}</h2>
                            <ClockIcon className="h-8 w-8 text-yellow-500" />
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">{module.moduleCode}</p>
                        </div>
                        <div className="px-6 pb-6 mt-4">
                          <div className="inline-block w-full text-center px-4 py-2 bg-primary-500 text-gray-900 dark:text-primary-foreground rounded-lg font-semibold">View Module</div>
                        </div>
                      </a>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-center text-gray-500 dark:text-gray-400">
                  <p>No active modules found.</p>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div>
              {Object.keys(groupedCompletedModules).length > 0 ? (
                Object.keys(groupedCompletedModules).map(academicYear => (
                  <div key={academicYear} className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{academicYear}</h2>
                    {Object.keys(groupedCompletedModules[academicYear]).map(yearOfStudy => (
                      <div key={yearOfStudy} className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">{yearOfStudy}</h3>
                        {Object.keys(groupedCompletedModules[academicYear][yearOfStudy]).map(semester => (
                          <div key={semester} className="mb-4">
                            <h4 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">{semester}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                              {groupedCompletedModules[academicYear][yearOfStudy][semester].map((module, i) => (
                                <motion.div
                                  key={module.module_id}
                                  custom={i}
                                  variants={cardVariants}
                                  initial="hidden"
                                  animate="visible"
                                  whileHover={{ scale: 1.03, boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' }}
                                >
                                  <Link href={`/student/my-modules/${module.module_id}`} legacyBehavior>
                                    <a className="bg-muted dark:bg-muted rounded-xl shadow-lg dark:shadow-dark-lg overflow-hidden h-full flex flex-col border border-primary/70">
                                      <div className="p-6 flex-grow">
                                        <div className="flex justify-between items-start">
                                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{module.title}</h2>
                                          <CheckCircleIcon className="h-8 w-8 text-green-500" />
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">{module.moduleCode}</p>
                                      </div>
                                      <div className="px-6 pb-6 mt-4">
                                        <div className="inline-block w-full text-center px-4 py-2 bg-primary-500 text-gray-900 dark:text-primary-foreground rounded-lg font-semibold">View Module</div>
                                      </div>
                                    </a>
                                  </Link>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-center text-gray-500 dark:text-gray-400">
                  <p>No completed modules found.</p>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setPage(prevPage => prevPage + 1)}
            className="bg-primary-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors duration-300"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

const TabButton = ({ title, activeTab, setActiveTab }) => {
  const isActive = activeTab.toLowerCase() === title.toLowerCase();
  return (
    <button 
      onClick={() => setActiveTab(title.toLowerCase())} 
      className={`px-4 py-2 text-lg font-medium transition-colors relative`}
    >
      <span className={`${isActive ? 'text-primary-500' : 'text-gray-500 dark:text-gray-300'}`}>{title}</span>
      {isActive && (
        <motion.div 
          className="absolute bottom-0 left-0 h-1 bg-primary-500 rounded-full"
          layoutId="underline"
        />
      )}
    </button>
  )
}

export default MyModulesPage;
