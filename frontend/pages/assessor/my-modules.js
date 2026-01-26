import { useState, useEffect, useRef } from 'react';
import api, { getAssessorModules, getAssessorCourses } from '../../lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, ClockIcon, ChevronDownIcon, BookOpenIcon, ChartBarIcon, XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/solid';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

import { MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon as ChevronDownOutline } from '@heroicons/react/24/outline';

const ModuleStatsModal = ({ module, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get(`/assessor/modules/${module.module_id}/stats`);
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [module.module_id]);

  const exportToCSV = () => {
    const data = stats.students.map(s => ({
      'Student Name': s.name,
      'Registration Number': s.regNumber,
      'Score (%)': s.finalScore,
      'Status': s.isPassed ? 'Passed' : 'Failed',
      'Competencies Met': s.competenciesMet,
      'Total Competencies': s.totalCompetencies
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `${module.moduleCode}_${module.academicYear?.name || ''}_Performance.csv`.replace(/\s+/g, '_');
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${module.title} (${module.moduleCode})`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Academic Period: ${module.academicYear?.name} - ${module.semester?.name}`, 14, 30);
    doc.text(`Class Average: ${stats.aggregate.average}% | Pass Rate: ${stats.aggregate.passRate}%`, 14, 38);

    const tableColumn = ["Student Name", "Reg Number", "Score", "Status", "Competencies"];
    const tableRows = stats.students.map(s => [
      s.name,
      s.regNumber,
      `${s.finalScore}%`,
      s.isPassed ? 'Passed' : 'Failed',
      `${s.competenciesMet} / ${s.totalCompetencies}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    const fileName = `${module.moduleCode}_${module.academicYear?.name || ''}_Performance.pdf`.replace(/\s+/g, '_');
    doc.save(fileName);
  };

  if (loading) return null;
  if (!stats) return null;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredStudents = stats.students
    .filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.regNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  const chartData = {
    labels: Object.keys(stats.aggregate.distribution),
    datasets: [
      {
        label: 'Number of Students',
        data: Object.values(stats.aggregate.distribution),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Grade Distribution',
      },
    },
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background border border-border w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-border flex justify-between items-center bg-card">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{module.title} Statistics</h2>
            <p className="text-sm text-muted-foreground">{module.academicYear?.name} • {module.semester?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-lg transition-colors border border-border"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              CSV
            </button>
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-lg transition-colors border border-border"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              PDF
            </button>
            <div className="w-px h-8 bg-border mx-2" />
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          {/* Aggregate Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Total Students" value={stats.aggregate.totalStudents} />
            <StatCard label="Class Average" value={`${stats.aggregate.average}%`} />
            <StatCard label="Median Score" value={`${stats.aggregate.median}%`} />
            <StatCard label="Pass Rate" value={`${stats.aggregate.passRate}%`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Chart */}
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <Bar data={chartData} options={chartOptions} />
            </div>

            {/* Student Table */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-bold text-foreground flex items-center">
                  <BookOpenIcon className="h-5 w-5 mr-2 text-primary" />
                  Student Performance
                </h3>
                <div className="relative w-full sm:w-64">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50 sticky top-0 z-10">
                      <tr>
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-1">
                            Student
                            {sortConfig.key === 'name' && (
                              sortConfig.direction === 'asc' ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownOutline className="h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleSort('finalScore')}
                        >
                          <div className="flex items-center gap-1">
                            Score
                            {sortConfig.key === 'finalScore' && (
                              sortConfig.direction === 'asc' ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownOutline className="h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Competencies</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <tr key={student.studentId} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-foreground">{student.name}</div>
                              <div className="text-xs text-muted-foreground">{student.regNumber}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {student.finalScore}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {student.competenciesMet} / {student.totalCompetencies}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-4 py-8 text-center text-sm text-muted-foreground italic">
                            No students found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="bg-card p-4 rounded-xl border border-primary/20 shadow-sm">
    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{label}</p>
    <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
  </div>
);

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
  const [selectedStatsModule, setSelectedStatsModule] = useState(null);

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

  // Group modules by Academic Year, then Semester
  const groupedModules = modules.reduce((acc, module) => {
    const year = module.academicYear?.name || 'Other';
    const semester = module.semester?.name || 'Other';

    if (!acc[year]) {
      acc[year] = {};
    }
    if (!acc[year][semester]) {
      acc[year][semester] = [];
    }
    acc[year][semester].push(module);
    return acc;
  }, {});

  // Sort Years (descending for completed, ascending for active)
  const sortedYears = Object.keys(groupedModules).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return activeTab === 'active' ? a.localeCompare(b) : b.localeCompare(a);
  });

  return (
    <div className="container mx-auto px-4 py-4">
      {selectedStatsModule && (
        <ModuleStatsModal 
          module={selectedStatsModule} 
          onClose={() => setSelectedStatsModule(null)} 
        />
      )}

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
                <div className="space-y-12">
                  {sortedYears.map((year) => (
                    <div key={year} className="space-y-8">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white pl-3 border-l-4 border-primary">
                        {year}
                      </h2>
                      
                      {Object.keys(groupedModules[year])
                        .sort()
                        .map((semester) => (
                          <div key={`${year}-${semester}`} className="space-y-4">
                            <h3 className="text-xl font-semibold text-muted-foreground ml-1 italic">
                               {semester}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                    onViewStats={() => setSelectedStatsModule(module)}
                                  />
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="bg-muted p-6 rounded-full mb-4">
                    <BookOpenIcon className="h-12 w-12 text-muted-foreground opacity-50" />
                  </div>
                  <p className="text-muted-foreground text-lg">No {activeTab} modules found for the selected course.</p>
                </div>
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

const ModuleCard = ({ module, completed, openDropdown, onDropdownClick, onViewStats }) => {
  const isOverdue = !completed && new Date(module.semester?.endDate) < new Date();

  return (
    <div className="bg-card shadow-lg dark:shadow-dark-lg rounded-xl p-5 h-full flex flex-col justify-between transition-all duration-300 border border-primary/20 hover:border-primary/50 relative group">
      <div className="absolute -top-2 -right-2 flex flex-col items-end gap-1 z-10">
        {module.ungradedCount > 0 && (
          <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
            {module.ungradedCount} PENDING
          </div>
        )}
        {isOverdue && (
          <div className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-white/20" title="Semester ended, waiting for final grading">
            PENDING CLOSURE
          </div>
        )}
      </div>
      
      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-foreground pr-2 leading-tight">{module.title}</h3>
          {completed ? (
            <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
          ) : (
            <ClockIcon className={`h-6 w-6 flex-shrink-0 ${isOverdue ? 'text-amber-500' : 'text-yellow-500'}`} />
          )}
        </div>
        <div className="flex items-center text-xs text-muted-foreground mb-3 font-medium">
          <BookOpenIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-primary" />
          <span className="truncate">{module.course?.name || module.course?.title}</span>
        </div>
        <p className="text-muted-foreground text-sm line-clamp-2 h-[40px] leading-relaxed">{module.description}</p>
      </div>

      <div className="mt-6 space-y-2">
        {completed && (
          <button 
            onClick={onViewStats}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-bold rounded-lg transition-colors border border-border"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            View Statistics
          </button>
        )}
        
        <div className="relative">
          <button onClick={() => onDropdownClick(module.module_id)} className="w-full text-center bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold py-2.5 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center">
            Manage Module <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform ${openDropdown === module.module_id ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === module.module_id && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-md shadow-2xl bg-card ring-1 ring-black ring-opacity-5 z-[100] border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="py-1 flex flex-col" role="menu" aria-orientation="vertical">
                <Link href={`/assessor/enroll-student?offeringId=${module.offeringId}`} legacyBehavior><a className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors" role="menuitem">Enroll Student</a></Link>
                <Link href={`/assessor/create-assessment?module_id=${module.module_id}`} legacyBehavior><a className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors" role="menuitem">Create Assessment</a></Link>
                <Link href={`/assessor/manage-assessments?module_id=${module.module_id}`} legacyBehavior><a className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors" role="menuitem">Manage Assessments</a></Link>
                <Link href={`/assessor/announcements?moduleId=${module.module_id}`} legacyBehavior><a className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors" role="menuitem">Announcements</a></Link>
                <Link href={`/assessor/grade-submissions?module_id=${module.module_id}`} legacyBehavior><a className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors" role="menuitem">Grade Submissions</a></Link>
                <Link href={`/assessor/enrolled-students?module_id=${module.module_id}`} legacyBehavior><a className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors" role="menuitem">View Enrolled Students</a></Link>
              </div>
            </div>
          )}
        </div>
      </div>
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