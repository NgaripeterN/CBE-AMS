import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import api, { getOfferingPerformance, getLeadCourse } from '../../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon, ChartBarIcon, UserGroupIcon, AcademicCapIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import useAuth from '../../../hooks/useAuth';
import Accordion from '../../../components/Accordion';

// Reusable Statistics Modal (simplified version of the one in my-modules.js)
const ModuleDetailModal = ({ moduleData, onClose }) => {
    if (!moduleData) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-background border border-border w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
            >
                <div className="p-6 border-b border-border flex justify-between items-center bg-card">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">{moduleData.title} Performance</h2>
                        <p className="text-sm text-muted-foreground">{moduleData.moduleCode} • {moduleData.studentCount} Students</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-muted/30 p-4 rounded-xl border border-border text-center">
                            <p className="text-xs text-muted-foreground uppercase font-bold">Average Score</p>
                            <p className="text-3xl font-bold text-primary">{moduleData.average}%</p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-xl border border-border text-center">
                            <p className="text-xs text-muted-foreground uppercase font-bold">Pass Rate</p>
                            <p className="text-3xl font-bold text-green-500">{moduleData.passRate}%</p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-xl border border-border text-center">
                            <p className="text-xs text-muted-foreground uppercase font-bold">Total Students</p>
                            <p className="text-3xl font-bold text-foreground">{moduleData.studentCount}</p>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <UserGroupIcon className="h-5 w-5 text-primary" />
                        Student Breakdown
                    </h3>
                    
                    <div className="overflow-hidden rounded-xl border border-border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Student Name</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Final Score</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {moduleData.students.map((student, idx) => (
                                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{student.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-foreground font-bold">{student.score}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {student.isPassed ? 'Passed' : 'Failed'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const PerformanceDashboard = () => {
    const router = useRouter();
    const { courseId } = router.query;
    const { user } = useAuth();

    const [isLead, setIsLead] = useState(false);
    const [academicYears, setAcademicYears] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState('');
    const [selectedSemesterId, setSelectedSemesterId] = useState('');
    
    const [performanceData, setPerformanceData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModule, setSelectedModule] = useState(null);

    const checkLeadAndFetchYears = useCallback(async () => {
        if (!courseId) return;
        try {
            const leadCourse = await getLeadCourse();
            if (leadCourse.course_id === courseId || user?.role === 'ADMIN') {
                setIsLead(true);
                const yearsRes = await api.get('/curriculum/years', { params: { courseId } });
                setAcademicYears(yearsRes.data);
            } else {
                router.push('/assessor');
            }
        } catch (error) {
            console.error("Auth/Data fetch failed", error);
        }
    }, [courseId, user, router]);

    useEffect(() => {
        if (router.isReady && user) {
            checkLeadAndFetchYears();
        }
    }, [router.isReady, user, checkLeadAndFetchYears]);

    const fetchSemesters = useCallback(async (yearId) => {
        const res = await api.get(`/curriculum/semesters/${yearId}`);
        setSemesters(res.data);
    }, []);

    useEffect(() => {
        if (selectedYearId) {
            fetchSemesters(selectedYearId);
            setSelectedSemesterId('');
            setPerformanceData([]);
        }
    }, [selectedYearId, fetchSemesters]);

    const handleFetchPerformance = useCallback(async () => {
        if (!selectedSemesterId || !courseId) return;
        setIsLoading(true);
        try {
            const data = await getOfferingPerformance(courseId, selectedSemesterId);
            setPerformanceData(data);
        } catch (error) {
            console.error("Failed to fetch performance data", error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedSemesterId, courseId]);

    useEffect(() => {
        if (selectedSemesterId) {
            handleFetchPerformance();
        }
    }, [selectedSemesterId, handleFetchPerformance]);

    // Grouping by year of study (optional, but good for organization)
    // Note: The backend doesn't currently return yearOfStudy in the results, 
    // but we can assume it for now or just list them all.
    
    return (
        <div className="container mx-auto px-4 py-8">
            {selectedModule && (
                <ModuleDetailModal 
                    moduleData={selectedModule} 
                    onClose={() => setSelectedModule(null)} 
                />
            )}

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-muted transition-colors">
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Offering Performance</h1>
                        <p className="text-muted-foreground">Course-wide student success metrics</p>
                    </div>
                </div>
                <ChartBarIcon className="h-12 w-12 text-primary/20" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-6 bg-card rounded-2xl border border-border shadow-lg">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase ml-1">Academic Year</label>
                    <select 
                        value={selectedYearId} 
                        onChange={e => setSelectedYearId(e.target.value)} 
                        className="w-full p-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    >
                        <option value="">Select Year</option>
                        {academicYears.map(year => <option key={year.id} value={year.id}>{year.name}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase ml-1">Semester</label>
                    <select 
                        value={selectedSemesterId} 
                        onChange={e => setSelectedSemesterId(e.target.value)} 
                        className="w-full p-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                        disabled={!selectedYearId}
                    >
                        <option value="">Select Semester</option>
                        {semesters.map(semester => <option key={semester.id} value={semester.id}>{semester.name}</option>)}
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground animate-pulse">Analyzing class performance...</p>
                </div>
            ) : performanceData.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {performanceData.map((module) => (
                            <motion.div 
                                key={module.moduleId}
                                whileHover={{ y: -4 }}
                                className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-primary/10 rounded-xl">
                                        <AcademicCapIcon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${module.passRate > 70 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {module.passRate}% Pass
                                        </span>
                                    </div>
                                </div>
                                
                                <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1">{module.title}</h3>
                                <p className="text-sm text-muted-foreground mb-6">{module.moduleCode}</p>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Avg Score</p>
                                        <p className="text-xl font-bold">{module.average}%</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Enrollment</p>
                                        <p className="text-xl font-bold">{module.studentCount}</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setSelectedModule(module)}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-secondary hover:bg-primary hover:text-white text-secondary-foreground font-bold rounded-xl transition-all"
                                >
                                    View Details
                                    <ChevronRightIcon className="h-4 w-4" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ) : selectedSemesterId ? (
                <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                    <AcademicCapIcon className="h-16 w-16 mx-auto text-muted-foreground opacity-20 mb-4" />
                    <p className="text-xl font-medium text-muted-foreground">No active offerings found for this semester.</p>
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-muted-foreground">Select a semester to view performance data.</p>
                </div>
            )}
        </div>
    );
};

export default PerformanceDashboard;