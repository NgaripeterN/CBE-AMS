import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { ArrowUpTrayIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const ImportModulesPage = () => {
    const router = useRouter();
    const { course_id } = router.query;
    const [files, setFiles] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [courseCompetencies, setCourseCompetencies] = useState([]); // State to store course-specific competencies

    useEffect(() => {
      const fetchCourseCompetencies = async () => {
        if (course_id) {
          try {
            const res = await api.get(`/lead/courses/${course_id}`);
            setCourseCompetencies(res.data.competencies || []);
          } catch (err) {
            toast.error('Failed to fetch course competencies for reference.');
          }
        }
      };
      fetchCourseCompetencies();
    }, [course_id]);

    const onDrop = useCallback(acceptedFiles => {
        setFiles(acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        })));
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
        }
    });

    const handleImport = async () => {
        if (files.length === 0) {
            toast.error('Please select a file to import.');
            return;
        }

        const file = files[0];
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n').filter(line => line.trim() !== '');
                if (lines.length < 2) {
                    toast.error('CSV file must have a header and at least one data row.');
                    return;
                }
                const headers = lines[0].replace('\r', '').split(',').map(h => h.trim());
                const modules = [];

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];
                    const data = [];
                    let currentField = '';
                    let inQuotes = false;
                    for (let j = 0; j < line.length; j++) {
                        const char = line[j];
                        if (char === '"') {
                            inQuotes = !inQuotes;
                        } else if (char === ',' && !inQuotes) {
                            data.push(currentField.trim());
                            currentField = '';
                        } else {
                            currentField += char;
                        }
                    }
                    data.push(currentField.trim());

                    if (data.length === headers.length) {
                        const moduleData = {};
                        for (let j = 0; j < headers.length; j++) {
                            moduleData[headers[j]] = data[j];
                        }
                        
                        if (moduleData.competencyNames) {
                          moduleData.competencyNames = moduleData.competencyNames.split(';').map(name => name.trim()).filter(name => name);
                        } else {
                          moduleData.competencyNames = [];
                        }
                        modules.push(moduleData);
                    }
                }

                setIsImporting(true);
                setImportResult(null);
                const res = await api.post(`/lead/import-modules?course_id=${course_id}`, { modules });
                setImportResult(res.data);
                toast.success('Import completed!');
            } catch (error) {
                console.error("Failed to import modules", error);
                toast.error('Failed to import modules. Make sure the file is a valid CSV.');
            } finally {
                setIsImporting(false);
            }
        };

        reader.readAsText(file);
    };
    
    const downloadSample = () => {
        const headers = ["moduleCode", "title", "description", "version", "status", "yearOfStudy", "semesterOfStudy", "competencyNames"];
        const sampleData = [
            ["CS101", "Introduction to Computer Science", "A foundational course on the principles of computing.", "1", "DRAFT", "1", "1", "Algorithmic Thinking;Programming Basics"],
            ["CS102", "Data Structures and Algorithms", "An in-depth look at data structures and algorithms.", "1", "DRAFT", "1", "2", "Data Structures"],
        ];

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + sampleData.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "sample-modules.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const removeFile = () => {
        setFiles([]);
    };

    return (
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto mt-8 w-full"> 
                <header className="mb-6">
                    <button onClick={() => router.back()} className="absolute top-0 left-0 mt-4 ml-4 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center">
                        <ArrowLeftIcon className="h-5 w-5 mr-1" /> Back
                    </button>
                    <h1 className="text-2xl font-bold text-foreground">Import Modules</h1>
                    <p className="mt-1 text-md text-muted-foreground">Drag and drop a CSV file to import modules into your course.</p>
                </header>

                {!importResult && (
                    <>
                        <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'}`}>
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center justify-center text-center">
                                <ArrowUpTrayIcon className="h-12 w-12 text-muted-foreground" />
                                <p className="mt-4 text-lg font-semibold text-foreground">{isDragActive ? 'Drop the file here...' : 'Drag & drop a CSV file here, or click to select'}</p>
                                <p className="text-sm text-muted-foreground">Maximum file size: 5MB</p>
                            </div>
                        </div>

                        {files.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-semibold text-foreground">Selected file:</h4>
                                <div className="flex items-center justify-between p-2 bg-background rounded-lg mt-2">
                                    <span>{files[0].name}</span>
                                    <button onClick={removeFile} className="p-1 rounded-full hover:bg-muted">
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-4">
                          <h4 className="font-semibold text-foreground mb-2">Available Competency Names for reference:</h4>
                          <div className="bg-muted/50 p-3 rounded-md max-h-48 overflow-y-auto text-sm text-muted-foreground">
                            {courseCompetencies.length > 0 ? (
                              <ul>
                                {courseCompetencies.map(comp => (
                                  <li key={comp.id}>
                                    <strong>{comp.name}</strong> (Category: {comp.category})
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p>No competencies associated with this course. Please contact an Admin to associate them.</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                            <button
                                onClick={downloadSample}
                                className="text-sm text-blue-500 hover:underline"
                            >
                                Download Sample CSV
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={isImporting || files.length === 0}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isImporting ? 'Importing...' : 'Import Modules'}
                            </button>
                        </div>
                    </>
                )}

                {importResult && (
                    <div className="mt-6 p-4 bg-background rounded-lg border border-border">
                        <h3 className="font-bold text-lg text-foreground">Import Summary</h3>
                        <p className="text-muted-foreground">Created: <span className="font-semibold text-green-500">{importResult.created}</span></p>
                        <p className="text-muted-foreground">Duplicates: <span className="font-semibold text-yellow-500">{importResult.duplicates}</span></p>
                        {importResult.errors && importResult.errors.length > 0 && (
                            <div>
                                <h4 className="font-bold mt-2 text-red-500">Errors:</h4>
                                <ul className="list-disc list-inside">
                                    {importResult.errors.map((err, index) => (
                                        <li key={index} className="text-red-500">{err.title} ({err.moduleCode}): {err.error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImportModulesPage;