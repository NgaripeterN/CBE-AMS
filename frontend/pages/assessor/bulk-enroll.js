import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';

const BulkEnroll = () => {
  const router = useRouter();
  const { module_id } = router.query;

  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        // The API is paginated, but for this dropdown, we should fetch all modules.
        // Assuming the API supports a 'limit' parameter to get all at once.
        const res = await api.get('/assessor/modules?limit=all');
        if (res.data && Array.isArray(res.data.modules)) {
            setModules(res.data.modules);
        } else {
            // Fallback for old API structure for safety, though it should be updated.
            setModules(res.data);
        }
      } catch (err) {
        setError('Failed to fetch modules.');
      }
    };
    fetchModules();
  }, []);

  useEffect(() => {
    if (module_id) {
      setSelectedModule(module_id);
    }
  }, [module_id]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedModule || !file) {
      setError('Please select a module and a CSV file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('module_id', selectedModule);

    setIsLoading(true);
    try {
      const response = await api.post('/assessor/bulk-enroll', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(response.data.message);
      if (response.data.errors && response.data.errors.length > 0) {
        setError(response.data.errors.join('\n'));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during bulk enrollment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        &larr; Back
      </button>
      <h1 className="text-3xl font-bold mb-6 text-foreground">Bulk Enroll Students</h1>
      <div className="max-w-xl mx-auto bg-card rounded-lg shadow-md p-8">
        <form onSubmit={handleSubmit}>
          {error && <p className="text-destructive-foreground bg-destructive/20 p-3 rounded-md mb-4 whitespace-pre-line">{error}</p>}
          {success && <p className="text-green-500 bg-green-500/20 p-3 rounded-md mb-4">{success}</p>}

          <div className="mb-4">
            <label htmlFor="module" className="block text-foreground font-semibold mb-2">Module</label>
            <select
              id="module"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background border-border disabled:bg-gray-200 dark:disabled:bg-gray-700"
              required
              disabled={!!module_id}
            >
              <option value="">Select a module</option>
              {Array.isArray(modules) && modules.map(module => (
                <option key={module.module_id} value={module.module_id}>{module.title}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="file" className="block text-foreground font-semibold mb-2">CSV File</label>
            <input
              type="file"
              id="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background border-border"
              required
            />
            <p className="text-muted-foreground text-sm mt-1">The CSV file must have a column named &#39;email&#39;.</p>
          </div>

          <div className="flex items-center justify-end">
            <button type="button" onClick={() => router.back()} className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-4 rounded-lg mr-2">Cancel</button>
            <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg" disabled={isLoading}>
              {isLoading ? 'Enrolling...' : 'Bulk Enroll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkEnroll;
