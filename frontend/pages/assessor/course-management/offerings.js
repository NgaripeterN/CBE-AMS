import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AsyncSelect from 'react-select/async';
import { useTheme } from 'next-themes';
import api from '../../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon, PlusIcon, UserPlusIcon, CalendarDaysIcon, BookOpenIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { customStyles } from '../../../styles/react-select-styles';
import Accordion from '../../../components/Accordion';
import useAuth from '../../../hooks/useAuth';
import { getLeadCourse } from '../../../lib/api';
import Toast from '../../../components/Toast';
import ConfirmDeleteModal from '../../../components/ConfirmDeleteModal';

const Modal = ({ children, onClose }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
        onClick={onClose}
    >
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
        >
            {children}
        </motion.div>
    </motion.div>
);

const OfferingsPage = () => {
    const router = useRouter();
    const { courseId } = router.query;
    const { user } = useAuth();
    const { theme } = useTheme();

    const [isLead, setIsLead] = useState(false);
    const [academicYears, setAcademicYears] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState('');
    const [selectedSemesterId, setSelectedSemesterId] = useState('');
    const [selectedYearOfStudy, setSelectedYearOfStudy] = useState('');
    
    const [offerings, setOfferings] = useState([]);
    const [offeringsPage, setOfferingsPage] = useState(1);
    const [offeringsTotalPages, setOfferingsTotalPages] = useState(1);
    const [hasMoreOfferings, setHasMoreOfferings] = useState(true);

    const [allCourseModules, setAllCourseModules] = useState([]);
    const [filteredModules, setFilteredModules] = useState([]);
    const [yearsOfStudy, setYearsOfStudy] = useState([]);

    const [isAssigning, setIsAssigning] = useState(null);
    const [isEditingOffering, setIsEditingOffering] = useState(null);

    const [selectedAssessors, setSelectedAssessors] = useState([]);

    const [editingOfferingAcademicYearId, setEditingOfferingAcademicYearId] = useState('');
    const [editingOfferingSemesterId, setEditingOfferingSemesterId] = useState('');
    const [editingOfferingSemesters, setEditingOfferingSemesters] = useState([]);

    const [isDeletingOffering, setIsDeletingOffering] = useState(null);
    const [conflictDetails, setConflictDetails] = useState(null);

    const [toastMessage, setToastMessage] = useState(null);
    const [toastType, setToastType] = useState(null);
    const [showToast, setShowToast] = useState(false);

    const checkIfLead = useCallback(async () => {
        if (user && user.role === 'LEAD') {
            try {
                const leadCourse = await getLeadCourse();
                if (leadCourse.course_id === courseId) {
                    setIsLead(true);
                }
            } catch (error) {
                console.error("Failed to check lead status", error);
            }
        }
        if (user && user.role === 'ADMIN') {
            setIsLead(true);
        }
    }, [user, courseId]);

    const fetchInitialData = useCallback(async () => {
        if (!courseId) return;
        const [yearsRes, curriculumRes] = await Promise.all([
            api.get('/curriculum/years', { params: { courseId } }),
            api.get(`/curriculum/courses/${courseId}`)
        ]);
        
        setAcademicYears(yearsRes.data);
        setAllCourseModules(curriculumRes.data);

        const uniqueYears = [...new Set(curriculumRes.data.map(m => m.yearOfStudy))].sort((a, b) => a - b);
        setYearsOfStudy(uniqueYears);
    }, [courseId]);

    useEffect(() => {
        if (router.isReady && user) {
            fetchInitialData();
            checkIfLead();
        }
    }, [router.isReady, user, checkIfLead, fetchInitialData]);

    const fetchSemesters = useCallback(async (yearId, setter = setSemesters) => {
        if (!yearId) {
            setter([]);
            return;
        }
        try {
            const res = await api.get(`/curriculum/semesters/${yearId}`);
            setter(res.data);
        } catch (error) {
            console.error("Error fetching semesters:", error);
            setter([]);
        }
    }, []);

    useEffect(() => {
        if (selectedYearId) {
            fetchSemesters(selectedYearId);
        }
    }, [selectedYearId, fetchSemesters]);

    useEffect(() => {
        if (isEditingOffering && editingOfferingAcademicYearId) {
            fetchSemesters(editingOfferingAcademicYearId, setEditingOfferingSemesters);
        } else if (!editingOfferingAcademicYearId) {
            setEditingOfferingSemesters([]);
        }
    }, [isEditingOffering, editingOfferingAcademicYearId, fetchSemesters]);

    const fetchOfferings = useCallback(async (page = 1, append = false) => {
        if (!selectedSemesterId) return [];
        try {
            const offeringsRes = await api.get(`/curriculum/offerings/${selectedSemesterId}?page=${page}&limit=10`);
            const newOfferings = offeringsRes.data.offerings;
            if (append) {
                setOfferings(prev => [...prev, ...newOfferings]);
            } else {
                setOfferings(newOfferings);
            }
            setOfferingsTotalPages(offeringsRes.data.totalPages);
            setOfferingsPage(offeringsRes.data.currentPage);
            setHasMoreOfferings(offeringsRes.data.currentPage < offeringsRes.data.totalPages);
            return newOfferings;
        } catch (error) {
            console.error("Error fetching offerings:", error);
            setOfferings([]);
            setOfferingsTotalPages(1);
            setOfferingsPage(1);
            setHasMoreOfferings(false);
            return [];
        }
    }, [selectedSemesterId]);

    const filterModules = useCallback(async () => {
        if (!selectedSemesterId || !selectedYearOfStudy) {
            setFilteredModules([]);
            setOfferings([]);
            setOfferingsPage(1);
            setOfferingsTotalPages(1);
            setHasMoreOfferings(false);
            return;
        }

        const newOfferings = await fetchOfferings(1, false);
        const offeredModuleIds = newOfferings.map(o => o.moduleId);

        const selectedSemester = semesters.find(s => s.id === selectedSemesterId);
        if (!selectedSemester) return;

        const semesterNumberMatch = selectedSemester.name.match(/\d+/);
        if (!semesterNumberMatch) {
            const unscheduled = allCourseModules.filter(cm => !offeredModuleIds.includes(cm.module_id));
            setFilteredModules(unscheduled);
            return;
        }
        const semesterNumber = parseInt(semesterNumberMatch[0], 10);

        const unscheduledModulesForSemesterAndYear = allCourseModules.filter(module => {
            const isCorrectSemester = module.semesterOfStudy === semesterNumber;
            const isCorrectYear = module.yearOfStudy === parseInt(selectedYearOfStudy);
            const isNotAlreadyOffered = !offeredModuleIds.includes(module.module_id);
            return isCorrectSemester && isCorrectYear && isNotAlreadyOffered;
        });

        setFilteredModules(unscheduledModulesForSemesterAndYear);

    }, [selectedSemesterId, selectedYearOfStudy, allCourseModules, semesters, fetchOfferings]);

    useEffect(() => {
        filterModules();
    }, [selectedSemesterId, selectedYearOfStudy, filterModules]);

    const handleLoadMoreOfferings = () => {
        fetchOfferings(offeringsPage + 1, true);
    };

    const loadAssessorOptions = async (inputValue) => {
        const res = await api.get(`/lead/assessors?search=${inputValue}`);
        return res.data.assessors.map(user => ({
            value: user.assessor.id,
            label: `${user.name} (${user.email})`
        }));
    };

    const handleAssignAssessor = async (e) => {
        e.preventDefault();
        const assessorIds = selectedAssessors.map(a => a.value);
        try {
            await api.post('/curriculum/offerings', {
                moduleId: isAssigning.module_id,
                semesterId: selectedSemesterId,
                assessorIds: assessorIds,
            });
            filterModules();
            setIsAssigning(null);
            setSelectedAssessors([]);
            setToastMessage('Module assigned and assessors set successfully!');
            setToastType('success');
            setShowToast(true);
        } catch (error) {
            setToastMessage(error.response?.data?.error || 'Failed to assign module.');
            setToastType('error');
            setShowToast(true);
        }
    };

    const handleUpdateOffering = async (e) => {
        if (e) e.preventDefault();
        if (!isEditingOffering) return;

        try {
            const assessorIds = selectedAssessors.map(a => a.value);
            
            // Extract metadata from the target semester to sync with the module
            const targetSemester = editingOfferingSemesters.find(s => s.id === editingOfferingSemesterId);
            const semesterNumberMatch = targetSemester?.name.match(/\d+/);
            const semesterOfStudy = semesterNumberMatch ? parseInt(semesterNumberMatch[0], 10) : undefined;
            
            // For yearOfStudy, we'll try to find which year the user originally intended 
            // but for now we use the filter context or keep existing.
            // A more robust way is to allow choosing yearOfStudy in the edit modal too.

            await api.put(`/curriculum/offerings/${isEditingOffering.id}`, {
                semesterId: editingOfferingSemesterId,
                assessorIds: assessorIds,
                semesterOfStudy: semesterOfStudy, // SYNC metadata
                yearOfStudy: parseInt(selectedYearOfStudy) // SYNC metadata based on current filter context
            });
            
            filterModules();
            setIsEditingOffering(null);
            setEditingOfferingAcademicYearId('');
            setEditingOfferingSemesterId('');
            setSelectedAssessors([]);
            setToastMessage('Offering updated and metadata synced successfully!');
            setToastType('success');
            setShowToast(true);
        } catch (error) {
            if (error.response?.status === 409) {
                setConflictDetails(error.response.data.conflict);
            } else {
                setToastMessage(error.response?.data?.error || 'Failed to update offering.');
                setToastType('error');
                setShowToast(true);
            }
        }
    };

    const handleDeleteOffering = async () => {
        if (!isDeletingOffering) return;
        try {
            await api.delete(`/curriculum/offerings/${isDeletingOffering.id}`);
            setToastMessage('Offering deleted successfully.');
            setToastType('success');
            setShowToast(true);
            filterModules();
            setIsDeletingOffering(null);
        } catch (error) {
            setToastMessage(error.response?.data?.error || 'Failed to delete offering.');
            setToastType('error');
            setShowToast(true);
        }
    };

    const handleConfirmReplace = async () => {
        if (!conflictDetails) return;
        try {
            await api.delete(`/curriculum/offerings/${conflictDetails.offeringId}`);
            setConflictDetails(null);
            await handleUpdateOffering();
        } catch (error) {
            setToastMessage('Failed to resolve conflict.');
            setToastType('error');
            setShowToast(true);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    const groupedOfferings = offerings.reduce((acc, offering) => {
        const year = offering.module.yearOfStudy;
        if (!acc[year]) acc[year] = [];
        acc[year].push(offering);
        return acc;
    }, {});

    return (
        <div className="container mx-auto px-4 py-4">
            <AnimatePresence>
                {isAssigning && isLead && (
                    <Modal onClose={() => setIsAssigning(null)}>
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Assign Assessors: {isAssigning.title}</h2>
                            <form onSubmit={handleAssignAssessor}>
                                <AsyncSelect
                                    cacheOptions defaultOptions isMulti
                                    loadOptions={loadAssessorOptions}
                                    styles={customStyles}
                                    onChange={setSelectedAssessors}
                                    value={selectedAssessors}
                                    placeholder="Search assessors..."
                                    className="mb-4"
                                />
                                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors">
                                    <PlusIcon className="h-5 w-5" /> Assign
                                </button>
                            </form>
                        </div>
                    </Modal>
                )}

                {isEditingOffering && isLead && (
                    <Modal onClose={() => setIsEditingOffering(null)}>
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Transfer/Edit: {isEditingOffering.module.title}</h2>
                            <form onSubmit={handleUpdateOffering}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Academic Year</label>
                                    <select
                                        value={editingOfferingAcademicYearId}
                                        onChange={e => { setEditingOfferingAcademicYearId(e.target.value); setEditingOfferingSemesterId(''); }}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                    >
                                        <option value="">Select Year</option>
                                        {academicYears.map(year => <option key={year.id} value={year.id}>{year.name}</option>)}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Semester</label>
                                    <select
                                        value={editingOfferingSemesterId}
                                        onChange={e => setEditingOfferingSemesterId(e.target.value)}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                        disabled={!editingOfferingAcademicYearId}
                                    >
                                        <option value="">Select Semester</option>
                                        {editingOfferingSemesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Assessors</label>
                                    <AsyncSelect
                                        cacheOptions defaultOptions isMulti
                                        loadOptions={loadAssessorOptions}
                                        styles={customStyles}
                                        onChange={setSelectedAssessors}
                                        value={selectedAssessors}
                                        placeholder="Search assessors..."
                                        className="mb-4"
                                    />
                                </div>
                                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors">
                                    <PencilIcon className="h-5 w-5" /> Update & Sync
                                </button>
                            </form>
                        </div>
                    </Modal>
                )}

                {isDeletingOffering && isLead && (
                    <ConfirmDeleteModal
                        title="Delete Offering?"
                        message={`Permanently remove the offering for "${isDeletingOffering.module.title}"?`}
                        onConfirm={handleDeleteOffering}
                        onClose={() => setIsDeletingOffering(null)}
                    />
                )}

                {conflictDetails && isLead && (
                    <Modal onClose={() => setConflictDetails(null)}>
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4 text-red-600">Conflict Detected</h2>
                            <p className="mb-6">An offering for &quot;{conflictDetails.moduleTitle}&quot; already exists in that semester. Replace it?</p>
                            <div className="flex justify-end gap-4">
                                <button onClick={() => setConflictDetails(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                                <button onClick={handleConfirmReplace} className="px-4 py-2 bg-red-500 text-white rounded-lg">Replace Existing</button>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
                <div className="flex items-center mb-6">
                    <button onClick={() => router.back()} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Class Scheduling & Enrollment</h1>
                </div>

                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <select value={selectedYearId} onChange={e => setSelectedYearId(e.target.value)} className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 border rounded-lg">
                        <option value="">Select Academic Year</option>
                        {academicYears.map(year => <option key={year.id} value={year.id}>{year.name}</option>)}
                    </select>
                    <select value={selectedSemesterId} onChange={e => setSelectedSemesterId(e.target.value)} className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 border rounded-lg" disabled={!selectedYearId}>
                        <option value="">Select Semester</option>
                        {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select value={selectedYearOfStudy} onChange={e => setSelectedYearOfStudy(e.target.value)} className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 border rounded-lg" disabled={!selectedSemesterId}>
                        <option value="">Select Year of Study</option>
                        {yearsOfStudy.map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                </div>

                {(selectedSemesterId && selectedYearOfStudy) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-2xl font-semibold mb-4">Scheduled Classes</h2>
                            {Object.keys(groupedOfferings).sort().map(year => (
                                <Accordion key={year} title={`Year ${year}`}>
                                    <div className="space-y-4">
                                        {groupedOfferings[year].map(off => (
                                            <div key={off.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex justify-between items-start">
                                                <div className="flex items-center gap-4">
                                                    <CalendarDaysIcon className="h-8 w-8 text-green-500" />
                                                    <div>
                                                        <h3 className="font-bold">{off.module.title}</h3>
                                                        <p className="text-sm text-gray-500">Assessors: {off.assessors.map(a => a.assessor.user.name).join(', ')}</p>
                                                    </div>
                                                </div>
                                                {isLead && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => {
                                                            setIsEditingOffering(off);
                                                            setEditingOfferingAcademicYearId(off.semester.academicYear.id);
                                                            setEditingOfferingSemesterId(off.semester.id);
                                                            setSelectedAssessors(off.assessors.map(a => ({ value: a.assessor.id, label: `${a.assessor.user.name} (${a.assessor.user.email})` })));
                                                        }} className="p-2 hover:bg-blue-100 rounded-full text-blue-500"><PencilIcon className="h-5 w-5" /></button>
                                                        <button onClick={() => setIsDeletingOffering(off)} className="p-2 hover:bg-red-100 rounded-full text-red-500"><TrashIcon className="h-5 w-5" /></button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Accordion>
                            ))}
                            {offerings.length === 0 && <p className="text-center text-gray-500 mt-8">No classes scheduled.</p>}
                            {hasMoreOfferings && <button onClick={handleLoadMoreOfferings} className="mt-4 w-full py-2 bg-blue-500 text-white rounded-lg">Load More</button>}
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold mb-4">Unscheduled Modules</h2>
                            <div className="space-y-4">
                                {filteredModules.map(m => (
                                    <div key={m.module_id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                                        <div className="flex items-center gap-4 mb-2">
                                            <BookOpenIcon className="h-8 w-8 text-blue-500" />
                                            <div>
                                                <h3 className="font-bold">{m.title}</h3>
                                                <p className="text-sm text-gray-500">Year {m.yearOfStudy}, Sem {m.semesterOfStudy}</p>
                                            </div>
                                        </div>
                                        {isLead && <button onClick={() => setIsAssigning(m)} className="w-full mt-2 py-2 bg-blue-500 text-white rounded-lg">Assign Assessors</button>}
                                    </div>
                                ))}
                                {filteredModules.length === 0 && <p className="text-center text-gray-500 mt-8">All modules scheduled.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
            <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} show={showToast} />
        </div>
    );
};

export default OfferingsPage;