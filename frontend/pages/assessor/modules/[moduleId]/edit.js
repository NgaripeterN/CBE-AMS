import React, { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/router';
import api from '../../../../lib/api'; // Corrected path: go up 4 levels
import toast from 'react-hot-toast';
import ErrorModal from '../../../../components/ErrorModal'; // Corrected path
import CompetencySelector from '../../../../components/CompetencySelector'; // Corrected path
import Loading from '../../../../components/Loading'; // Corrected path
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const EditModulePage = () => {
    const router = useRouter();
    const { moduleId } = router.query; // Get moduleId from URL
    const [isLoading, setIsLoading] = useState(true);
    const [module, setModule] = useState(null);
    const [courseCompetencies, setCourseCompetencies] = useState([]);

    const [formData, setFormData] = useState({
        moduleCode: '',
        title: '',
        description: '',
        version: '',
        status: '',
        yearOfStudy: '',
        semesterOfStudy: '',
    });
    const [selectedCompetencyIds, setSelectedCompetencyIds] = useState([]);
    const [error, setError] = useState('');
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

    useEffect(() => {
        if (!router.isReady || !moduleId) return;

        const fetchModuleAndCourseData = async () => {
            try {
                // Fetch module details
                const moduleRes = await api.get(`/modules/${moduleId}`);
                const fetchedModule = moduleRes.data;
                setModule(fetchedModule);

                // Fetch course details to get course-specific competencies
                const courseRes = await api.get(`/lead/courses/${fetchedModule.course_id}`);
                setCourseCompetencies(courseRes.data.competencies || []);

                setFormData({
                    moduleCode: fetchedModule.moduleCode,
                    title: fetchedModule.title,
                    description: fetchedModule.description || '',
                    version: fetchedModule.version.toString(),
                    status: fetchedModule.status,
                    yearOfStudy: fetchedModule.yearOfStudy !== null ? fetchedModule.yearOfStudy.toString() : '',
                    semesterOfStudy: fetchedModule.semesterOfStudy !== null ? fetchedModule.semesterOfStudy.toString() : '',
                });
                setSelectedCompetencyIds(fetchedModule.competencies ? fetchedModule.competencies.map(c => c.id) : []);

            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load module data.');
                setIsErrorModalOpen(true);
                setModule(null); // Indicate failure
            } finally {
                setIsLoading(false);
            }
        };

        fetchModuleAndCourseData();
    }, [router.isReady, moduleId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsErrorModalOpen(false);

        const year = parseInt(formData.yearOfStudy, 10);
        const semester = parseInt(formData.semesterOfStudy, 10);

        if (year < 1 || year > 8) {
            setError('Year of Study must be between 1 and 8.');
            setIsErrorModalOpen(true);
            return;
        }

        if (semester < 1 || semester > 3) {
            setError('Semester of Study must be between 1 and 3.');
            setIsErrorModalOpen(true);
            return;
        }

        try {
            await api.put(`/lead/modules/${moduleId}`, {
                ...formData,
                version: parseInt(formData.version, 10),
                yearOfStudy: year,
                semesterOfStudy: semester,
                competencyIds: selectedCompetencyIds, // Include selected competencies
            });
            toast.success(`Module '${formData.title}' updated successfully!`);
            router.push(`/assessor/course-management/${module.course_id}`); // Redirect back to curriculum page
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred while updating the module.');
            setIsErrorModalOpen(true);
        }
    };

    if (isLoading) {
        return <Loading />;
    }

    if (!module) {
        return (
            <div className="container mx-auto px-4 py-8 text-center text-destructive">
                <p>Module not found or an error occurred.</p>
                <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <Fragment>
            <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button onClick={() => router.back()} className="absolute top-8 left-4 sm:left-6 lg:left-8 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center">
                    <ArrowLeftIcon className="h-5 w-5 mr-1" /> Back
                </button>
                <div className="max-w-2xl mx-auto bg-card rounded-xl shadow-lg p-6 md:p-8">
                    <header className="mb-6">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">Edit Module</h1>
                        <p className="mt-2 text-md md:text-lg text-gray-600 dark:text-gray-300">Update the details for the module &quot;{module.title}&quot;.</p>
                    </header>

                    <form onSubmit={handleSubmit}>
                        {error && <div className="bg-red-500/20 border-l-4 border-red-500 text-red-500 p-3 mb-4" role="alert"><p className="text-sm">{error}</p></div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="title" className="block text-md font-semibold text-gray-900 dark:text-white mb-1">Module Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    id="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="moduleCode" className="block text-md font-semibold text-gray-900 dark:text-white mb-1">Module Code</label>
                                <input
                                    type="text"
                                    name="moduleCode"
                                    id="moduleCode"
                                    value={formData.moduleCode}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="description" className="block text-md font-semibold text-gray-900 dark:text-white mb-1">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                ></textarea>
                            </div>
                            <div>
                                <label htmlFor="yearOfStudy" className="block text-md font-semibold text-gray-900 dark:text-white mb-1">Year of Study</label>
                                <input
                                    type="number"
                                    name="yearOfStudy"
                                    id="yearOfStudy"
                                    value={formData.yearOfStudy}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="semesterOfStudy" className="block text-md font-semibold text-gray-900 dark:text-white mb-1">Semester of Study</label>
                                <input
                                    type="number"
                                    name="semesterOfStudy"
                                    id="semesterOfStudy"
                                    value={formData.semesterOfStudy}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="version" className="block text-md font-semibold text-gray-900 dark:text-white mb-1">Version</label>
                                <input
                                    type="number"
                                    name="version"
                                    id="version"
                                    value={formData.version}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-md font-semibold text-gray-900 dark:text-white mb-1">Status</label>
                                <select
                                    name="status"
                                    id="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="PUBLISHED">Published</option>
                                    <option value="DEPRECATED">Deprecated</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Associate Competencies</h3>
                            <CompetencySelector
                                availableCompetencies={courseCompetencies}
                                selectedIds={selectedCompetencyIds}
                                onChange={setSelectedCompetencyIds}
                            />
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 shadow-lg hover:shadow-xl"
                            >
                                Update Module
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <ErrorModal
                isOpen={isErrorModalOpen}
                message={error}
                onClose={() => setIsErrorModalOpen(false)}
            />
        </Fragment>
    );
};

export default EditModulePage;