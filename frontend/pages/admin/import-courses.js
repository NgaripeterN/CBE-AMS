import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';

const ImportCoursesPage = () => {
  const [files, setFiles] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onDrop = (acceptedFiles) => {
    setFiles(acceptedFiles);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      try {
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = ['name', 'code'];
        if (!requiredHeaders.every(h => headers.includes(h))) {
          setError(`CSV must have at least the following headers: ${requiredHeaders.join(', ')}`);
          return;
        }

        const parsedCourses = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
          }, {});
        });
        setCourses(parsedCourses);
        setError(null);
      } catch (e) {
        setError('Failed to parse CSV file.');
        setCourses([]);
      }
    };
    reader.readAsText(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post('/admin/import-courses', { courses });
      setSuccess(response.data);
      toast.success('Courses imported successfully!');
      setFiles([]);
      setCourses([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import courses');
      toast.error(err.response?.data?.error || 'Failed to import courses');
    }
    setLoading(false);
  };

  return (
    <>
      <div className="mb-6">
        <button onClick={() => router.back()} className="inline-flex items-center px-4 py-2 bg-muted text-muted-foreground rounded-md shadow-sm hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring">
          <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
          Back
        </button>
      </div>
      <h1 className="text-3xl font-bold mb-6 text-foreground">Import Courses</h1>
      <div className="grid grid-cols-1 gap-6">
        <div {...getRootProps()} className={`p-12 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
          <input {...getInputProps()} />
          <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">
            {isDragActive ? 'Drop the files here ...' : 'Drag \'n\' drop a CSV file here, or click to select a file'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">CSV file should have columns: name, code, category (optional), description (optional)</p>
        </div>

        {files.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-lg font-semibold">Selected File:</h2>
            <ul>
              {files.map(file => (
                <li key={file.path}>{`${file.path} - ${file.size} bytes`}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border-l-4 border-red-500 text-red-700 p-4 rounded-md dark:bg-red-500/20 dark:text-red-400" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border-l-4 border-green-500 text-green-700 p-4 rounded-md dark:bg-green-500/20 dark:text-green-400" role="alert">
            <p className="font-bold">Import Successful</p>
            <p>{success.message}</p>
            <p>Created: {success.created}</p>
            <p>Duplicates: {success.duplicates}</p>
            {success.errors && success.errors.length > 0 && (
              <div>
                <p className="font-bold mt-2">Errors:</p>
                <ul>
                  {success.errors.map((err, index) => (
                    <li key={index}>{`${err.name} (${err.code}): ${err.error}`}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {courses.length > 0 && (
          <div className="bg-card border border-border rounded-lg">
            <h2 className="text-xl font-bold p-4 border-b border-border">Courses to Import ({courses.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Code</th>
                    <th className="px-6 py-3 font-medium">Category</th>
                    <th className="px-6 py-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="px-6 py-4">{course.name}</td>
                      <td className="px-6 py-4">{course.code}</td>
                      <td className="px-6 py-4">{course.category}</td>
                      <td className="px-6 py-4">{course.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border">
              <button
                onClick={handleImport}
                disabled={loading}
                className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ImportCoursesPage;
