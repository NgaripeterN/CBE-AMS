import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import api, { getStudentProgressData } from '../../lib/api';
import ConfirmUnenrollModal from '../../components/ConfirmUnenrollModal';
import { ArrowLeftIcon, ChartBarIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const EnrolledStudents = () => {
  const router = useRouter();
  const { module_id } = router.query;

  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUnenrollModalOpen, setIsUnenrollModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Progress Modal State
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [selectedStudentProgress, setSelectedStudentProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      if (module_id) {
        try {
          const res = await api.get(`/modules/${module_id}/students`);
          setEnrollments(res.data);
        } catch (err) {
          setError('Failed to fetch enrolled students.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchStudents();
  }, [module_id]);

  const handleUnenroll = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsUnenrollModalOpen(true);
  };

  const confirmUnenroll = async () => {
    try {
      await api.delete(`/assessor/enrollments/${selectedEnrollment.id}`);
      setEnrollments(enrollments.filter(e => e.id !== selectedEnrollment.id));
      toast.success('Student unenrolled successfully.');
    } catch (err) {
      console.error("Unenrollment error:", err);
      toast.error('Failed to unenroll student.');
    }
    setIsUnenrollModalOpen(false);
  };

  const handleViewProgress = async (enrollment) => {
    setLoadingProgress(true);
    setIsProgressModalOpen(true);
    try {
      const result = await getStudentProgressData(1, module_id, enrollment.student.id);
      if (result.data && result.data.length > 0) {
        setSelectedStudentProgress(result.data[0]);
      } else {
        setSelectedStudentProgress(null);
      }
    } catch (err) {
      console.error("Failed to fetch progress:", err);
      toast.error("Failed to load detailed progress.");
    } finally {
      setLoadingProgress(false);
    }
  };

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((enrollment) =>
      enrollment.student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.student.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [enrollments, searchTerm]);

  const paginatedEnrollments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEnrollments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEnrollments, currentPage]);

  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage);

  const calculateScore = (sub) => {
    if (!sub.grade || !sub.assessment.rubric) return null;
    
    // Check if grade.questionScores exists (it should if graded properly)
    const totalScore = sub.grade.questionScores?.reduce((acc, q) => acc + (Number(q.score) || 0), 0) || 0;
    
    // Calculate total marks from rubric
    const totalMarks = sub.assessment.rubric.questions?.reduce((acc, q) => acc + (Number(q.marks) || 0), 0) || 0;
    
    const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
    
    return { totalScore, totalMarks, percentage };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
            <button onClick={() => router.back()} className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-4 rounded-lg flex items-center transition-colors mr-4">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Go Back
            </button>
            <h1 className="text-3xl font-bold text-foreground">Enrolled Students</h1>
        </div>
        
        <div className="relative w-full md:w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
                type="text"
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card focus:ring-2 focus:ring-primary focus:outline-none"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                }}
            />
        </div>
      </div>

      {isLoading && <p>Loading students...</p>}
      {error && <p className="text-destructive-foreground bg-destructive/20 p-3 rounded-md mb-4">{error}</p>}

      {!isLoading && !error && (
        <div className="bg-card shadow-sm rounded-lg overflow-hidden border border-border">
            <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
                <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Progress</th>
                <th scope="col" className="relative px-6 py-3 text-right">
                    <span className="sr-only">Actions</span>
                </th>
                </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
                {paginatedEnrollments.length > 0 ? (
                    paginatedEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                            onClick={() => handleViewProgress(enrollment)}
                            className="text-foreground hover:text-primary hover:underline focus:outline-none font-bold flex items-center gap-2 transition-colors"
                        >
                            {enrollment.student.user.name}
                            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
                        </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{enrollment.student.user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground w-1/4">
                        {enrollment.progress ? (
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-xs">
                                    <span>{enrollment.progress.percentage}%</span>
                                    <span>{enrollment.progress.completed}/{enrollment.progress.total} Completed</span>
                                </div>
                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-primary h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${enrollment.progress.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <span className="text-xs italic">No data</span>
                        )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                            onClick={() => handleUnenroll(enrollment)} 
                            className="text-destructive hover:text-destructive/80 transition-colors"
                        >
                            Remove
                        </button>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-muted-foreground">
                            No students found.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t border-border bg-muted/10">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredEnrollments.length)}</span> of <span className="font-medium">{filteredEnrollments.length}</span> students
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded-md border border-border bg-card text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded-md border border-border bg-card text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}

      {isUnenrollModalOpen && (
        <ConfirmUnenrollModal 
            studentName={selectedEnrollment.student.user.name} 
            onConfirm={confirmUnenroll} 
            onClose={() => setIsUnenrollModalOpen(false)} 
        />
      )}

      {isProgressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-border flex flex-col">
                <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
                    <h2 className="text-2xl font-bold text-foreground">Student Progress</h2>
                    <button onClick={() => setIsProgressModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="p-6 flex-grow">
                    {loadingProgress ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : selectedStudentProgress ? (
                        <div className="space-y-8">
                            {/* Header Stats */}
                            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl">
                                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl">
                                    {selectedStudentProgress.student.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">{selectedStudentProgress.student.name}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedStudentProgress.student.email}</p>
                                    <div className="flex gap-4 mt-2 text-sm">
                                        <span className={`font-semibold ${selectedStudentProgress.stats.isAtRisk ? 'text-red-500' : 'text-green-500'}`}>
                                            {selectedStudentProgress.stats.isAtRisk ? 'Risk Status: At Risk' : 'Risk Status: On Track'}
                                        </span>
                                        <span className="text-muted-foreground">
                                            Last Active: {selectedStudentProgress.stats.lastActivity ? new Date(selectedStudentProgress.stats.lastActivity).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Submissions List */}
                            <div>
                                <h4 className="text-lg font-semibold mb-4 border-b border-border pb-2">Assessments & Grades</h4>
                                {selectedStudentProgress.submissions.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedStudentProgress.submissions.map(sub => {
                                            const scoreData = calculateScore(sub);
                                            return (
                                                <div key={sub.submission_id} className="flex justify-between items-center p-3 bg-muted/20 rounded-lg border border-border">
                                                    <div>
                                                        <p className="font-medium text-foreground">{sub.assessment.title}</p>
                                                        <p className="text-xs text-muted-foreground">Submitted: {new Date(sub.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        {sub.grade ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold mb-1">
                                                                    Graded
                                                                </span>
                                                                {scoreData && (
                                                                    <span className="text-sm font-bold text-foreground">
                                                                        {scoreData.percentage}% ({scoreData.totalScore}/{scoreData.totalMarks})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="inline-block px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-bold">
                                                                Pending
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4 italic">No submissions yet.</p>
                                )}
                            </div>

                            {/* Competency Mastery Section */}
                            <div>
                                <h4 className="text-lg font-semibold mb-4 border-b border-border pb-2">Competency Mastery</h4>
                                <div className="bg-muted/20 p-4 rounded-xl border border-border">
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Competencies Demonstrated</p>
                                            <p className="text-2xl font-bold text-foreground">
                                                {selectedStudentProgress.stats.competenciesMastered} <span className="text-sm text-foreground/70 font-normal">/ {selectedStudentProgress.stats.totalCompetencies}</span>
                                            </p>
                                        </div>
                                        <span className="text-sm font-bold text-foreground">
                                            {selectedStudentProgress.stats.totalCompetencies > 0 
                                                ? Math.round((selectedStudentProgress.stats.competenciesMastered / selectedStudentProgress.stats.totalCompetencies) * 100) 
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-secondary h-3 rounded-full overflow-hidden mb-6">
                                        <div 
                                            className="bg-primary h-full rounded-full transition-all duration-500 ease-out" 
                                            style={{ 
                                                width: `${selectedStudentProgress.stats.totalCompetencies > 0 
                                                    ? (selectedStudentProgress.stats.competenciesMastered / selectedStudentProgress.stats.totalCompetencies) * 100 
                                                    : 0}%` 
                                            }}
                                        />
                                    </div>

                                    {/* Detailed Competency List */}
                                    {selectedStudentProgress.competencyDetails && selectedStudentProgress.competencyDetails.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {selectedStudentProgress.competencyDetails.map((comp) => (
                                                <div key={comp.id} className={`p-3 rounded-lg border flex justify-between items-center ${comp.count > 0 ? 'bg-card border-primary/20' : 'bg-muted/50 border-transparent opacity-60'}`}>
                                                    <span className="text-sm font-medium text-foreground truncate pr-2" title={comp.name}>
                                                        {comp.name}
                                                    </span>
                                                    {comp.count > 0 ? (
                                                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
                                                            x{comp.count}/{comp.totalCount}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Pending (0/{comp.totalCount})</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center italic">No competency details available.</p>
                                    )}
                                </div>
                            </div>

                            {/* Observations List */}
                            <div>
                                <h4 className="text-lg font-semibold mb-4 border-b border-border pb-2">Assessor Observations</h4>
                                {selectedStudentProgress.observations.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedStudentProgress.observations.map(obs => (
                                            <div key={obs.id} className="p-3 bg-muted/20 rounded-lg border border-border">
                                                <p className="text-sm text-foreground mb-1">{obs.notes}</p>
                                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                                    <span>Descriptor: {obs.descriptor || 'N/A'}</span>
                                                    <span>{new Date(obs.recordedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4 italic">No observations recorded.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            Failed to load data for this student.
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-border bg-muted/10 flex justify-end rounded-b-2xl">
                    <button 
                        onClick={() => setIsProgressModalOpen(false)}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default EnrolledStudents;
