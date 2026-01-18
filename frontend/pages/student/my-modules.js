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

  // Group completed modules by Year and Semester
  const groupedCompletedModules = completedModules.reduce((acc, module) => {
    const year = module.yearOfStudy || 'Unknown Year';
    const semester = module.semesterOfStudy || 'Unknown Semester';
    const key = `${year}-${semester}`;

    if (!acc[key]) {
      acc[key] = {
        year,
        semester,
        modules: [],
      };
    }
    acc[key].modules.push(module);
    return acc;
  }, {});

  // Sort groups: Years ascending, then Semesters ascending
  const sortedCompletedGroups = Object.values(groupedCompletedModules).sort((a, b) => {
    if (a.year === 'Unknown Year') return 1;
    if (b.year === 'Unknown Year') return -1;
    if (a.year !== b.year) return a.year - b.year;
    
    if (a.semester === 'Unknown Semester') return 1;
    if (b.semester === 'Unknown Semester') return -1;
    return a.semester - b.semester;
  });

  const modulesToShow = activeTab === 'active' ? activeModules : completedModules;

  if (loading && page === 1) {
    return (
      <div className="flex justify-center items-center h-screen bg-background text-foreground">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
        <p className="text-destructive">{error}</p>
      </div>
    );
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen text-foreground">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">My Modules</h1>
      </div>

      <div className="mb-10">
        <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-700">
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
                    className="h-full"
                  >
                    <Link href={`/student/my-modules/${module.module_id}`} legacyBehavior>
                      <a className="bg-card hover:bg-muted/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col border border-border group">
                        <div className="p-8 flex-grow">
                          <div className="flex justify-between items-start mb-4">
                            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-bold rounded-full uppercase tracking-wider">
                              In Progress
                            </span>
                            <ClockIcon className="h-6 w-6 text-yellow-500" />
                          </div>
                          <h2 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                            {module.title}
                          </h2>
                          <p className="text-muted-foreground font-mono text-sm tracking-tight">{module.moduleCode}</p>
                        </div>
                        <div className="px-8 pb-8">
                          <div className="w-full text-center px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-sm group-hover:bg-primary/90 transition-colors">
                            View Module
                          </div>
                        </div>
                      </a>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-center py-20 border-2 border-dashed border-muted-foreground/20 rounded-2xl">
                  <p className="text-muted-foreground text-xl">No active modules found.</p>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-16">
              {sortedCompletedGroups.length > 0 ? (
                sortedCompletedGroups.map((group) => (
                  <div key={`${group.year}-${group.semester}`} className="space-y-8">
                    <h3 className="text-2xl font-bold text-primary flex items-center gap-3">
                       <span className="bg-primary/10 px-4 py-2 rounded-xl">
                         {group.year === 'Unknown Year' ? 'Other' : `Year ${group.year}`}
                       </span>
                       {group.semester !== 'Unknown Semester' && (
                         <span className="text-muted-foreground">
                            • Semester {group.semester}
                         </span>
                       )}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {group.modules.map((module, i) => (
                        <motion.div
                          key={module.module_id}
                          custom={i}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          className="h-full"
                        >
                          <Link href={`/student/my-modules/${module.module_id}`} legacyBehavior>
                            <a className="bg-card hover:bg-muted/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col border border-border group">
                              <div className="p-8 flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                  <span className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded-full uppercase tracking-wider">
                                    Completed
                                  </span>
                                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                                  {module.title}
                                </h2>
                                <p className="text-muted-foreground font-mono text-sm tracking-tight">{module.moduleCode}</p>
                              </div>
                              <div className="px-8 pb-8">
                                <div className="w-full text-center px-4 py-3 bg-secondary text-secondary-foreground rounded-xl font-bold shadow-sm group-hover:bg-secondary/90 transition-colors">
                                  View Details
                                </div>
                              </div>
                            </a>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                    <div className="border-b border-border/50 pt-8" />
                  </div>
                ))
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-center py-20 border-2 border-dashed border-muted-foreground/20 rounded-2xl">
                  <p className="text-muted-foreground text-xl">No completed modules found.</p>
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
