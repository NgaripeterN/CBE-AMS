import { useState, useEffect } from 'react';
import api from '../../lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import CollapsibleSection from '../../components/CollapsibleSection';

const MyModulesPage = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  // Handle tab change: reset state and page
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setModules([]);
      setPage(1);
      setActiveTab(tab);
      setHasMore(true);
    }
  };

  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      try {
        // Pass the activeTab to the backend
        const { data } = await api.get(`/student/my-modules?page=${page}&limit=${limit}&tab=${activeTab}`);
        
        if (page === 1) {
          setModules(data.modules);
        } else {
          setModules(prevModules => [...prevModules, ...data.modules]);
        }
        
        setHasMore(data.hasMore);
      } catch (err) {
        setError('Failed to load modules.');
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, [page, limit, activeTab]);

  // Group completed modules by Year, then Semester (only relevant for completed tab)
  const groupedByYear = activeTab === 'completed' ? modules.reduce((acc, module) => {
    const year = module.yearOfStudy || 'Unknown Year';
    const semester = module.semesterOfStudy || 'Unknown Semester';

    if (!acc[year]) {
      acc[year] = {};
    }
    if (!acc[year][semester]) {
      acc[year][semester] = [];
    }
    acc[year][semester].push(module);
    return acc;
  }, {}) : {};

  // Sort Years
  const sortedYears = Object.keys(groupedByYear).sort((a, b) => {
    if (a === 'Unknown Year') return 1;
    if (b === 'Unknown Year') return -1;
    return a - b;
  });

  if (loading && page === 1 && modules.length === 0) {
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
          <TabButton title="Active" activeTab={activeTab} setActiveTab={handleTabChange} />
          <TabButton title="Completed" activeTab={activeTab} setActiveTab={handleTabChange} />
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
              {modules.length > 0 ? (
                modules.map((module, i) => (
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
                !loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-center py-20 border-2 border-dashed border-muted-foreground/20 rounded-2xl">
                    <p className="text-muted-foreground text-xl">No active modules found.</p>
                  </motion.div>
                )
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-12">
              {sortedYears.length > 0 ? (
                sortedYears.map((year, yearIndex) => (
                  <div key={year} className="space-y-4">
                    <h3 className="text-2xl font-bold text-foreground pl-1 border-l-4 border-primary/50">
                      {year === 'Unknown Year' ? 'Other' : `Year ${year}`}
                    </h3>

                    {Object.keys(groupedByYear[year])
                      .sort((a, b) => {
                         if (a === 'Unknown Semester') return 1;
                         if (b === 'Unknown Semester') return -1;
                         return a - b;
                      })
                      .map((semester, semIndex) => (
                      <CollapsibleSection 
                        key={`${year}-${semester}`} 
                        title={
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground font-medium">
                              {semester === 'Unknown Semester' ? 'Other' : `Semester ${semester}`}
                            </span>
                            <span className="bg-primary/10 px-2 py-0.5 rounded text-xs font-semibold text-primary">
                              {groupedByYear[year][semester].length} Modules
                            </span>
                          </div>
                        }
                        defaultOpen={yearIndex === sortedYears.length - 1} // Open semesters of the latest year by default
                      >
                        <div className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                              {groupedByYear[year][semester].map((module, i) => (
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
                        </div>
                      </CollapsibleSection>
                    ))}
                  </div>
                ))
              ) : (
                !loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-center py-20 border-2 border-dashed border-muted-foreground/20 rounded-2xl">
                    <p className="text-muted-foreground text-xl">No completed modules found.</p>
                  </motion.div>
                )
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
