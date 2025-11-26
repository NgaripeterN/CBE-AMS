import React, { useState, useEffect } from 'react';

const EditModuleModal = ({ module, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        moduleCode: '',
        title: '',
        description: '',
        version: '1',
        status: 'DRAFT',
        yearOfStudy: '1',
        semesterOfStudy: '1',
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (module) {
            setFormData({
                moduleCode: module.moduleCode,
                title: module.title,
                description: module.description || '',
                version: module.version.toString(),
                status: module.status,
                yearOfStudy: module.yearOfStudy !== null ? module.yearOfStudy.toString() : '',
                semesterOfStudy: module.semesterOfStudy !== null ? module.semesterOfStudy.toString() : '',
            });
        }
    }, [module]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const year = parseInt(formData.yearOfStudy, 10);
        const semester = parseInt(formData.semesterOfStudy, 10);

        if (year < 1 || year > 8) {
            setError('Year of Study must be between 1 and 8.');
            return;
        }

        if (semester < 1 || semester > 3) {
            setError('Semester of Study must be between 1 and 3.');
            return;
        }

        onUpdate({
            ...formData,
            version: parseInt(formData.version, 10),
            yearOfStudy: year,
            semesterOfStudy: semester,
        });
    };

    if (!module) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-popover rounded-xl shadow-lg p-6 md:p-8 max-w-2xl w-full mx-4">
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

                    <div className="mt-6 flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
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
    );
};

export default EditModuleModal;
