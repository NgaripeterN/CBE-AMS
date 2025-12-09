import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import api from '../../../lib/api';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, BookOpenIcon, PencilIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import ConfirmDeleteModal from '../../../components/ConfirmDeleteModal';
import Accordion from '../../../components/Accordion';
import CredentialRequirementsModal from '../../../components/CredentialRequirementsModal';
import Link from 'next/link';

const CurriculumPage = () => {
    const router = useRouter();
    const { courseId } = router.query;
    const [course, setCourse] = useState(null);
    const [curriculum, setCurriculum] = useState([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedModule, setSelectedModule] = useState(null);
    const [credentialModules, setCredentialModules] = useState(new Set());
    const [initialCredentialModules, setInitialCredentialModules] = useState(new Set());
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [changedModules, setChangedModules] = useState({ added: [], removed: [] });
    const [courseCompetencies, setCourseCompetencies] = useState([]); // State for competencies associated with the course

    const fetchCourseDetails = useCallback(async () => {
        try {
            const res = await api.get(`/lead/courses/${courseId}`); // Assuming this endpoint now includes course.competencies
            setCourse(res.data);
            const initialModules = new Set(res.data.credentialModuleIds || []);
            setCredentialModules(initialModules);
            setInitialCredentialModules(initialModules);
            setCourseCompetencies(res.data.competencies || []); // Set course competencies
        } catch (error) {
            console.error("Failed to fetch course details", error);
        }
    }, [courseId]);

    const fetchCurriculum = useCallback(async () => {
        try {
            // Ensure this endpoint fetches modules with their associated competencies
            const res = await api.get(`/curriculum/courses/${courseId}`);
            setCurriculum(res.data);
        } catch (error) {
            console.error("Failed to fetch curriculum", error);
        }
    }, [courseId]);

    useEffect(() => {
        if (courseId) {
            fetchCourseDetails();
            fetchCurriculum();
        }
    }, [courseId, fetchCourseDetails, fetchCurriculum]);

    const handleEdit = (module) => {
        router.push(`/assessor/modules/${module.module_id}/edit`); // Redirect to dedicated edit page
    };

    const handleDelete = (module) => {
        setSelectedModule(module);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/lead/modules/${selectedModule.module_id}`);
            fetchCurriculum();
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error("Failed to delete module", error);
        }
    };

    // Removed handleUpdate as it's no longer needed in this component

    const handleToggleCredentialModule = (moduleId) => {
        setCredentialModules(prev => {
            const newSet = new Set(prev);
            if (newSet.has(moduleId)) {
                newSet.delete(moduleId);
            } else {
                newSet.add(moduleId);
            }
            return newSet;
        });
    };

    const handleOpenConfirmModal = () => {
        const added = [...credentialModules]
            .filter(id => !initialCredentialModules.has(id))
            .map(id => curriculum.find(m => m.module_id === id));

        const removed = [...initialCredentialModules]
            .filter(id => !credentialModules.has(id))
            .map(id => curriculum.find(m => m.module_id === id));

        setChangedModules({ added, removed });
        setConfirmModalOpen(true);
    };

    const executeSave = async () => {
        const toastId = toast.loading('Saving...');
        try {
            await api.put(`/lead/courses/${courseId}/credential-rule`, {
                module_ids: Array.from(credentialModules),
            });
            toast.success('Credential requirements saved!', { id: toastId });
            setInitialCredentialModules(credentialModules); // Update initial state after save
            setConfirmModalOpen(false);
        } catch (error) {
            console.error("Failed to save credential modules", error);
            toast.error('Failed to save credential requirements.', { id: toastId });
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

    if (!course) return <div className="flex justify-center items-center h-full"><p>Loading...</p></div>;

    const groupedCurriculum = curriculum.reduce((acc, item) => {
        const year = item.yearOfStudy;
        const semester = item.semesterOfStudy;
        if (!acc[year]) {
            acc[year] = {};
        }
        if (!acc[year][semester]) {
            acc[year][semester] = [];
        }
        acc[year][semester].push(item);
        return acc;
    }, {});

    return (
        <>
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <button onClick={() => router.back()} className="mr-4 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <ArrowLeftIcon className="h-6 w-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Curriculum Designer: {course.name}</h1>
                            <p className="text-gray-500 dark:text-gray-400">Select modules required for the final course credential.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleOpenConfirmModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
                        >
                            Save Credential Requirements
                        </button>
                    </div>
                </div>

                <motion.div variants={itemVariants}>
                    {Object.keys(groupedCurriculum).sort().map(year => (
                        <Accordion key={year} title={`Year ${year}`} defaultOpen={true}>
                            {Object.keys(groupedCurriculum[year]).sort().map(semester => (
                                <Accordion key={semester} title={`Semester ${semester}`}>
                                    <div className="space-y-4">
                                        {groupedCurriculum[year][semester].map(item => (
                                            <motion.div key={item.module_id} variants={itemVariants} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <BookOpenIcon className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                                                    <div>
                                                        <p className="font-bold text-lg text-gray-900 dark:text-white">{item.title}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => handleToggleCredentialModule(item.module_id)}
                                                        className="p-2 rounded-full text-gray-400 hover:text-yellow-500 transition-colors"
                                                        title={credentialModules.has(item.module_id) ? 'Remove from credential requirements' : 'Add to credential requirements'}
                                                    >
                                                        {credentialModules.has(item.module_id) ? (
                                                            <SolidStarIcon className="h-6 w-6 text-yellow-500 drop-shadow-[0_0_8px_rgba(252,211,77,0.7)]" />
                                                        ) : (
                                                            <StarIcon className="h-6 w-6" />
                                                        )}
                                                    </button>
                                                    <button onClick={() => handleEdit(item)} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(item)} className="p-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-700 transition-colors">
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </Accordion>
                            ))}
                        </Accordion>
                    ))}
                    {curriculum.length === 0 && (
                        <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No modules have been added to the curriculum yet.</p>
                    )}
                </motion.div>
            </motion.div>

            <CredentialRequirementsModal
                isOpen={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={executeSave}
                addedModules={changedModules.added}
                removedModules={changedModules.removed}
            />

            {isDeleteModalOpen && (
                <ConfirmDeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="Delete Module"
                    message={`Are you sure you want to delete the module "${selectedModule?.title}"? This action cannot be undone.`}
                />
            )}
        </>
    );
};

export default CurriculumPage;