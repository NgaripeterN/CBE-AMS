import { useState, useEffect, useRef } from 'react';
import { getAssessorModules, getAssessorCourses } from '../../lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, ClockIcon, ChevronDownIcon, BookOpenIcon } from '@heroicons/react/24/solid';
import CollapsibleSection from '../../components/CollapsibleSection';

const CustomSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="relative w-full sm:w-64">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="block w-full pl-3 pr-10 py-2 text-base border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary text-left flex justify-between items-center"
      >
        <span className="truncate text-foreground">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDownIcon className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute mt-1 w-full rounded-md shadow-lg bg-background ring-1 ring-black ring-opacity-5 z-[9999]"
          >
            <div className="py-1 max-h-60 overflow-y-auto">
              {options.map(option => (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-muted/50 cursor-pointer"
                >
                  {option.label}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MyModules = () => {
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('all');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await getAssessorCourses();
        setCourses(res || []);
      } catch (err) {
        console.error("Failed to load courses");
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        const res = await getAssessorModules(activeTab, page, selectedCourse);
        setModules(res.modules || []);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        setError('Failed to load modules.');
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, [activeTab, page, selectedCourse]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setOpenDropdown(null);
  };

  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId);
    setPage(1);
    setOpenDropdown(null);
  };

  const handleDropdownClick = (moduleId) => {
    setOpenDropdown(openDropdown === moduleId ? null : moduleId);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
      },
    }),
  };

  const courseOptions = [
    { value: 'all', label: 'All Courses' },
    ...courses.map(course => ({ value: course.course_id, label: course.name }))
  ];

  // Group modules by Year, then Semester (for both Active and Completed)
  const groupedModules = modules.reduce((acc, module) => {
    const year = module.yearOfStudy || 'Unknown Year';
    const semester = module.semesterOfStudy || module.semester || 'Unknown Semester';

    if (!acc[year]) {
      acc[year] = {};
    }
    if (!acc[year][semester]) {
      acc[year][semester] = [];
    }
    acc[year][semester].push(module);
    return acc;
  }, {});

  // Sort Years
  const sortedYears = Object.keys(groupedModules).sort((a, b) => {
    if (a === 'Unknown Year') return 1;
    if (b === 'Unknown Year') return -1;
    return a - b;
  });

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <h1 className="text-3xl font-bold text-foreground">My Modules</h1>
        <CustomSelect
          options={courseOptions}
          value={selectedCourse}
          onChange={handleCourseChange}
          placeholder="Filter by Course"
        />
      </div>

      <div className="flex space-x-4 border-b border-border mb-4">
        <TabButton title="Active" activeTab={activeTab} setActiveTab={handleTabChange} />
        <TabButton title="Completed" activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div></div>
      ) : error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : (
        <>
          <AnimatePresence mode='wait'>
            <motion.div
              key={`${activeTab}-${selectedCourse}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {sortedYears.length > 0 ? (
                <div className="space-y-8">
                  {sortedYears.map((year, yearIndex) => (
                    <div key={year} className="space-y-4">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white pl-1 border-l-4 border-primary/50">
                        {year === 'Unknown Year' ? 'Other' : `Year ${year}`}
                      </h2>
                      
                      {Object.keys(groupedModules[year])
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
                                  {groupedModules[year][semester].length} Modules
                                </span>
                              </div>
                            }
                            defaultOpen={yearIndex === sortedYears.length - 1}
                          >
                            <div className="pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                  {groupedModules[year][semester].map((module, i) => (
                                    <motion.div
                                      key={module.module_id}
                                      custom={i}
                                      variants={cardVariants}
                                      initial="hidden"
                                      animate="visible"
                                      className="h-full"
                                    >
                                      <ModuleCard 
                                        module={module} 
                                        completed={activeTab === 'completed'}
                                        openDropdown={openDropdown}
                                        onDropdownClick={handleDropdownClick}
                                      />
                                    </motion.div>
                                  ))}
                                </div>
                            </div>
                          </CollapsibleSection>
                        ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-16">No {activeTab} modules found for the selected course.</p>
              )}
            </motion.div>
          </AnimatePresence>

          {modules.length > 0 && totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-border bg-card text-sm font-medium text-foreground">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ModuleCard = ({ module, completed, openDropdown, onDropdownClick }) => (
  <div className="bg-muted dark:bg-muted shadow-lg dark:shadow-dark-lg rounded-lg p-4 h-full flex flex-col justify-between transition-shadow duration-300 border border-primary/70">
    <div>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-foreground pr-2">{module.title}</h3>
        {completed ? (
          <CheckCircleIcon className="h-7 w-7 text-green-500 flex-shrink-0" />
        ) : (
          <ClockIcon className="h-7 w-7 text-yellow-500 flex-shrink-0" />
        )}
      </div>
      <div className="flex items-center text-sm text-muted-foreground mb-3">
        <BookOpenIcon className="h-4 w-4 mr-2 flex-shrink-0" />
        <span className="truncate">{module.course.title}</span>
      </div>
      <p className="text-muted-foreground text-sm line-clamp-2 h-[40px]">{module.description}</p>
    </div>
    <div className="relative mt-4">
      <button onClick={() => onDropdownClick(module.module_id)} className="block w-full text-center bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center">
        Manage Module <ChevronDownIcon className={`w-5 h-5 ml-2 transition-transform ${openDropdown === module.module_id ? 'rotate-180' : ''}`} />
      </button>
      {openDropdown === module.module_id && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-md shadow-2xl bg-card ring-1 ring-black ring-opacity-5 z-[100] border border-border">
          <div className="py-1 flex flex-col" role="menu" aria-orientation="vertical">
            <Link href={`/assessor/enroll-student?offeringId=${module.offeringId}`} legacyBehavior><a className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted/80 transition-colors" role="menuitem">Enroll Student</a></Link>
            <Link href={`/assessor/create-assessment?module_id=${module.module_id}`} legacyBehavior><a className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted/80 transition-colors" role="menuitem">Create Assessment</a></Link>
            <Link href={`/assessor/manage-assessments?module_id=${module.module_id}`} legacyBehavior><a className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted/80 transition-colors" role="menuitem">Manage Assessments</a></Link>
            <Link href={`/assessor/announcements?moduleId=${module.module_id}`} legacyBehavior><a className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted/80 transition-colors" role="menuitem">Announcements</a></Link>
            <Link href={`/assessor/grade-submissions?module_id=${module.module_id}`} legacyBehavior><a className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted/80 transition-colors" role="menuitem">Grade Submissions</a></Link>
            <Link href={`/assessor/enrolled-students?module_id=${module.module_id}`} legacyBehavior><a className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted/80 transition-colors" role="menuitem">View Enrolled Students</a></Link>
          </div>
        </div>
      )}
    </div>
  </div>
);

const TabButton = ({ title, activeTab, setActiveTab }) => {
  const isActive = activeTab.toLowerCase() === title.toLowerCase();
  return (
    <button 
      onClick={() => setActiveTab(title.toLowerCase())} 
      className={`px-4 py-2 text-lg font-medium transition-colors relative`}
    >
      <span className={`${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{title}</span>
      {isActive && (
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          layoutId="underline"
        />
      )}
    </button>
  )
}

export default MyModules;