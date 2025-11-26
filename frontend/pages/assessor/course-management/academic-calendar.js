import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';
import { motion } from 'framer-motion';
import { PlusIcon, CalendarIcon, ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import ConfirmDeleteModal from '../../../components/ConfirmDeleteModal';
import Toast from '../../../components/Toast';
import useAuth from '../../../hooks/useAuth';

const AcademicCalendar = () => {
    const router = useRouter();
    const { courseId } = router.query;
    const { user } = useAuth();
    const [isLead, setIsLead] = useState(false);
    const [academicYears, setAcademicYears] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [selectedYear, setSelectedYear] = useState(null);
    
    const [newYearName, setNewYearName] = useState('');
    const [newYearStart, setNewYearStart] = useState('');
    const [newYearEnd, setNewYearEnd] = useState('');

    const [newSemesterName, setNewSemesterName] = useState('');
    const [newSemesterStart, setNewSemesterStart] = useState('');
    const [newSemesterEnd, setNewSemesterEnd] = useState('');

    const [editingYear, setEditingYear] = useState(null);
    const [editingSemester, setEditingSemester] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [yearToDelete, setYearToDelete] = useState(null);
    const [isSemesterDeleteModalOpen, setIsSemesterDeleteModalOpen] = useState(false);
    const [semesterToDelete, setSemesterToDelete] = useState(null);

    const [yearError, setYearError] = useState(null);
    const [semesterError, setSemesterError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Toast state
    const [toastMessage, setToastMessage] = useState(null);
    const [toastType, setToastType] = useState(null);

    const showToast = (message, type) => {
        setToastMessage(message);
        setToastType(type);
    };

    const clearToast = () => {
        setToastMessage(null);
        setToastType(null);
    };

    useEffect(() => {
        if (!router.isReady || !user) {
            return;
        }

        const loadPageData = async () => {
            setLoading(true);
            try {
                let userIsLead = false;
                if (user.role === 'ADMIN') {
                    userIsLead = true;
                } else if (user.role === 'LEAD') {
                    await api.get(`/lead/courses/${courseId}`); 
                    userIsLead = true;
                }
                setIsLead(userIsLead);
                
                const res = await api.get(`/curriculum/years`, { params: { courseId } });
                setAcademicYears(res.data);

                setLoading(false);
            } catch (err) {
                console.error("Error in loadPageData:", err);
                setIsLead(false);
                setError("You do not have permission to view this page or it failed to load.");
                setLoading(false);
            }
        };

        loadPageData();
    }, [router.isReady, user, courseId]);


    useEffect(() => {
        if (selectedYear) {
            fetchSemesters(selectedYear.id);
        } else {
            setSemesters([]);
        }
    }, [selectedYear]);

    const fetchSemesters = async (yearId) => {
        try {
            const res = await api.get(`/curriculum/semesters/${yearId}`);
            setSemesters(res.data);
        } catch (error) {
            console.error("Failed to fetch semesters", error);
        }
    };

    const handleCreateYear = async (e) => {
        e.preventDefault();
        setYearError(null);
        try {
            await api.post('/curriculum/years', { name: newYearName, startDate: newYearStart, endDate: newYearEnd, courseId });
            const res = await api.get(`/curriculum/years`, { params: { courseId } });
            setAcademicYears(res.data);
            setNewYearName(''); setNewYearStart(''); setNewYearEnd('');
            showToast('Academic year created successfully!', 'success');
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                setYearError(error.response.data.error);
                showToast(error.response.data.error, 'error');
            } else {
                setYearError('An unexpected error occurred.');
                showToast('An unexpected error occurred.', 'error');
            }
            console.error("Failed to create academic year", error);
        }
    };

    const handleUpdateYear = async (e) => {
        e.preventDefault();
        setYearError(null);
        try {
            await api.put(`/curriculum/years/${editingYear.id}`, { name: editingYear.name, startDate: editingYear.startDate, endDate: editingYear.endDate });
            const res = await api.get(`/curriculum/years`, { params: { courseId } });
            setAcademicYears(res.data);
            setEditingYear(null);
            showToast('Academic year updated successfully!', 'success');
        }  catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                setYearError(error.response.data.error);
                showToast(error.response.data.error, 'error');
            } else {
                setYearError('An unexpected error occurred.');
                showToast('An unexpected error occurred.', 'error');
            }
            console.error("Failed to update academic year", error);
        }
    };

    const openDeleteModal = (year) => {
        setYearToDelete(year);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteYear = async () => {
        if (yearToDelete) {
            try {
                await api.delete(`/curriculum/years/${yearToDelete.id}`);
                const res = await api.get(`/curriculum/years`, { params: { courseId } });
                setAcademicYears(res.data);
                setIsDeleteModalOpen(false);
                setYearToDelete(null);
                showToast('Academic year deleted successfully!', 'success');
            } catch (error) {
                console.error("Failed to delete academic year", error);
                showToast('Error deleting academic year.', 'error');
            }
        }
    };

    const handleCreateSemester = async (e) => {
        e.preventDefault();
        if (!selectedYear) return;
        setSemesterError(null);
        try {
            await api.post('/curriculum/semesters', { 
                name: newSemesterName, 
                academicYearId: selectedYear.id, 
                startDate: newSemesterStart, 
                endDate: newSemesterEnd
            });
            const res = await api.get(`/curriculum/semesters/${selectedYear.id}`);
            setSemesters(res.data);
            setNewSemesterName(''); setNewSemesterStart(''); setNewSemesterEnd('');
            showToast('Semester created successfully!', 'success');
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                setSemesterError(error.response.data.error);
                showToast(error.response.data.error, 'error');
            } else {
                setSemesterError('An unexpected error occurred.');
                showToast('An unexpected error occurred.', 'error');
            }
            console.error("Failed to create semester", error);
        }
    };

    const handleUpdateSemester = async (e) => {
        e.preventDefault();
        setSemesterError(null);
        try {
            await api.put(`/curriculum/semesters/${editingSemester.id}`, { name: editingSemester.name, startDate: editingSemester.startDate, endDate: editingSemester.endDate });
            const res = await api.get(`/curriculum/semesters/${selectedYear.id}`);
            setSemesters(res.data);
            setEditingSemester(null);
            showToast('Semester updated successfully!', 'success');
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                setSemesterError(error.response.data.error);
                showToast(error.response.data.error, 'error');
            } else {
                setSemesterError('An unexpected error occurred.');
                showToast('An unexpected error occurred.', 'error');
            }
            console.error("Failed to update semester", error);
        }
    };

    const openSemesterDeleteModal = (semester) => {
        setSemesterToDelete(semester);
        setIsSemesterDeleteModalOpen(true);
    };

    const confirmDeleteSemester = async () => {
        if (semesterToDelete) {
            try {
                await api.delete(`/curriculum/semesters/${semesterToDelete.id}`);
                const res = await api.get(`/curriculum/semesters/${selectedYear.id}`);
                setSemesters(res.data);
                setIsSemesterDeleteModalOpen(false);
                setSemesterToDelete(null);
                showToast('Semester deleted successfully!', 'success');
            } catch (error) {
                console.error("Failed to delete semester", error);
                showToast('Error deleting semester.', 'error');
            }
        }
    };


    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };
    
    if (loading) {
        return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
    }
    if (error) {
        return <div className="flex justify-center items-center h-screen"><p className="text-red-500">{error}</p></div>;
    }

    return (
        <>
            <Toast message={toastMessage} type={toastType} onClose={clearToast} />
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
                <div className="flex items-center mb-6">
                    <button onClick={() => router.back()} className="mr-4 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Academic Calendar</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Academic Years</h2>
                        {isLead && (
                            <form onSubmit={handleCreateYear} className="mb-6 space-y-4">
                                <input value={newYearName} onChange={(e) => { setNewYearName(e.target.value); setYearError(null); }} placeholder="e.g., 2025-2026" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                                <div className="flex gap-4">
                                    <div>
                                        <label htmlFor="newYearStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                                        <input id="newYearStart" type="date" value={newYearStart} onChange={(e) => { setNewYearStart(e.target.value); setYearError(null); }} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                                    </div>
                                    <div>
                                        <label htmlFor="newYearEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                                        <input id="newYearEnd" type="date" value={newYearEnd} onChange={(e) => { setNewYearEnd(e.target.value); setYearError(null); }} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                                    </div>
                                </div>
                                {yearError && <p className="text-red-500 text-sm">{yearError}</p>}
                                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors">
                                    <PlusIcon className="h-5 w-5" />
                                    Create Year
                                </button>
                            </form>
                        )}
                        <ul className="space-y-2">
                            {academicYears.map(year => (
                                <li key={year.id} 
                                    className={`p-3 rounded-lg cursor-pointer transition-colors flex justify-between items-center ${selectedYear?.id === year.id ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`} 
                                    onClick={() => setSelectedYear(year)}>
                                    <div className="flex items-center gap-3">
                                        <CalendarIcon className="h-5 w-5 text-gray-500" />
                                        <span className="font-medium">{year.name}</span>
                                    </div>
                                    {isLead && (
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); setEditingYear(year); setYearError(null); }} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                                <PencilIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); openDeleteModal(year); }} className="p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-700">
                                                <TrashIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            </button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Semesters {selectedYear ? `for ${selectedYear.name}` : ''}</h2>
                        {selectedYear && isLead && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <form onSubmit={handleCreateSemester} className="mb-6 space-y-4">
                                    <input value={newSemesterName} onChange={(e) => { setNewSemesterName(e.target.value); setSemesterError(null); }} placeholder="e.g., Semester 1" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500" required />
                                    <div className="flex gap-4">
                                        <div>
                                            <label htmlFor="newSemesterStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                                            <input id="newSemesterStart" type="date" value={newSemesterStart} onChange={(e) => { setNewSemesterStart(e.target.value); setSemesterError(null); }} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500" required />
                                        </div>
                                        <div>
                                            <label htmlFor="newSemesterEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                                            <input id="newSemesterEnd" type="date" value={newSemesterEnd} onChange={(e) => { setNewSemesterEnd(e.target.value); setSemesterError(null); }} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500" required />
                                        </div>
                                    </div>
                                    {semesterError && <p className="text-red-500 text-sm">{semesterError}</p>}
                                    <button type="submit" className="w-full flex items-center justify-center gap-2 bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors">
                                        <PlusIcon className="h-5 w-5" />
                                        Create Semester
                                    </button>
                                </form>
                            </motion.div>
                        )}
                        <ul className="space-y-2">
                            {semesters.map(semester => (
                                <motion.li key={semester.id} variants={itemVariants} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <CalendarIcon className="h-5 w-5 text-gray-500" />
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{semester.name}</span>
                                    </div>
                                    {isLead && (
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingSemester(semester); setSemesterError(null); }} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                                <PencilIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                            </button>
                                            <button onClick={() => openSemesterDeleteModal(semester)} className="p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-700">
                                                <TrashIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            </button>
                                        </div>
                                    )}
                                </motion.li>
                            ))}
                        </ul>
                        {!selectedYear && <p className="text-center text-gray-500 dark:text-gray-400 mt-8">Select an academic year to see its semesters.</p>}
                    </motion.div>
                </div>
            </motion.div>

            {isDeleteModalOpen && isLead && (
                <ConfirmDeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDeleteYear}
                    title="Delete Academic Year"
                    message={`Are you sure you want to delete the academic year "${yearToDelete?.name}"? This will also delete all associated semesters and offerings. This action cannot be undone.`}
                />
            )}

            {isSemesterDeleteModalOpen && isLead && (
                <ConfirmDeleteModal
                    isOpen={isSemesterDeleteModalOpen}
                    onClose={() => setIsSemesterDeleteModalOpen(false)}
                    onConfirm={confirmDeleteSemester}
                    title="Delete Semester"
                    message={`Are you sure you want to delete the semester "${semesterToDelete?.name}"? This will also delete all associated offerings. This action cannot be undone.`}
                />
            )}

            {editingYear && isLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Edit Academic Year</h2>
                        <form onSubmit={handleUpdateYear} className="space-y-4">
                            <input value={editingYear.name} onChange={(e) => { setEditingYear({...editingYear, name: e.target.value}); setYearError(null); }} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" required />
                            <div className="flex gap-4">
                                <div>
                                    <label htmlFor="editYearStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                                    <input id="editYearStart" type="date" value={editingYear.startDate.split('T')[0]} onChange={(e) => { setEditingYear({...editingYear, startDate: e.target.value}); setYearError(null); }} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" required />
                                </div>
                                <div>
                                    <label htmlFor="editYearEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                                    <input id="editYearEnd" type="date" value={editingYear.endDate.split('T')[0]} onChange={(e) => { setEditingYear({...editingYear, endDate: e.target.value}); setYearError(null); }} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" required />
                                </div>
                            </div>
                            {yearError && <p className="text-red-500 text-sm">{yearError}</p>}
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={() => setEditingYear(null)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editingSemester && isLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Edit Semester</h2>
                        <form onSubmit={handleUpdateSemester} className="space-y-4">
                            <input value={editingSemester.name} onChange={(e) => { setEditingSemester({...editingSemester, name: e.target.value}); setSemesterError(null); }} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" required />
                            <div className="flex gap-4">
                                <div>
                                    <label htmlFor="editSemesterStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                                    <input id="editSemesterStart" type="date" value={editingSemester.startDate.split('T')[0]} onChange={(e) => { setEditingSemester({...editingSemester, startDate: e.target.value}); setSemesterError(null); }} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" required />
                                </div>
                                <div>
                                    <label htmlFor="editSemesterEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                                    <input id="editSemesterEnd" type="date" value={editingSemester.endDate.split('T')[0]} onChange={(e) => { setEditingSemester({...editingSemester, endDate: e.target.value}); setSemesterError(null); }} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" required />
                                </div>
                            </div>
                            {semesterError && <p className="text-red-500 text-sm">{semesterError}</p>}
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={() => setEditingSemester(null)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AcademicCalendar;