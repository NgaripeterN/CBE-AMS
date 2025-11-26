import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import Select from 'react-select';
import { useTheme } from 'next-themes';
import { customStyles } from '../../styles/react-select-styles';

const ImportUsersPage = () => {
  const [files, setFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [defaultProgram, setDefaultProgram] = useState(null);
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/admin/courses');
        setCourses(res.data.data);
      } catch (err) {
        console.error('Failed to fetch courses', err);
      }
    };
    fetchCourses();
  }, []);

  const onDrop = (acceptedFiles) => {
    setFiles(acceptedFiles);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      try {
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = ['firstName', 'lastName', 'email', 'role'];
        if (!requiredHeaders.every(h => headers.includes(h))) {
          setError(`CSV must have at least the following headers: ${requiredHeaders.join(', ')}`);
          return;
        }

        const parsedUsers = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
          }, {});
        });
        setUsers(parsedUsers);
        setError(null);
      } catch (e) {
        setError('Failed to parse CSV file.');
        setUsers([]);
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
    if (users.some(u => u.role.toUpperCase() === 'STUDENT') && !defaultProgram) {
      toast.error('Please select a default program for the students being imported.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post('/admin/import-users', { users, defaultProgram: defaultProgram?.value });
      setSuccess(response.data);
      toast.success('Users imported successfully!');
      setFiles([]);
      setUsers([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import users');
      toast.error(err.response?.data?.error || 'Failed to import users');
    }
    setLoading(false);
  };

  const programOptions = courses.map(course => ({
    value: course.name,
    label: course.name,
  }));

  return (
    <>
      <div className="mb-6">
        <button onClick={() => router.back()} className="inline-flex items-center px-4 py-2 bg-muted text-muted-foreground rounded-md shadow-sm hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring">
          <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
          Back
        </button>
      </div>
      <h1 className="text-3xl font-bold mb-6 text-foreground">Import Users</h1>
      <div className="grid grid-cols-1 gap-6">
        <div {...getRootProps()} className={`p-12 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
          <input {...getInputProps()} />
          <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">
            {isDragActive ? 'Drop the files here ...' : 'Drag &apos;n&apos; drop a CSV file here, or click to select a file'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">CSV file should have columns: firstName, lastName, email, role, regNumber (for students), program (optional for students)</p>
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

        {users.some(u => u.role.toUpperCase() === 'STUDENT') && (
          <div className="bg-card border border-border rounded-lg p-4">
            <label htmlFor="default-program" className="block text-sm font-medium text-foreground mb-2">
              Default Program for Students
            </label>
            <Select
              id="default-program"
              styles={customStyles}
              options={programOptions}
              onChange={setDefaultProgram}
              value={defaultProgram}
              placeholder="Select a default program..."
              isClearable
            />
            <p className="text-xs text-muted-foreground mt-1">This program will be assigned to any student in the CSV without a &apos;program&apos; column specified.</p>
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
                    <li key={index}>{`${err.email}: ${err.error}`}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {users.length > 0 && (
          <div className="bg-card border border-border rounded-lg">
            <h2 className="text-xl font-bold p-4 border-b border-border">Users to Import ({users.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">First Name</th>
                    <th className="px-6 py-3 font-medium">Last Name</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Program</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">{user.firstName}</td>
                      <td className="px-6 py-4">{user.lastName}</td>
                      <td className="px-6 py-4">{user.role}</td>
                      <td className="px-6 py-4">{user.program || `(use default: ${defaultProgram?.label || "not selected"})`}</td>
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

export default ImportUsersPage;
