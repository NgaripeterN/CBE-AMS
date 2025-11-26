import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../../lib/api';
import Loading from '../../../components/Loading';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const EditModulePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    moduleCode: '',
    title: '',
    description: '',
    version: '',
    status: '',
    yearOfStudy: '',
    semesterOfStudy: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (id) {
      const fetchModule = async () => {
        try {
          const { data } = await api.get(`/modules/${id}`);
          setFormData({
            moduleCode: data.moduleCode,
            title: data.title,
            description: data.description || '',
            version: data.version.toString(),
            status: data.status,
            yearOfStudy: data.yearOfStudy?.toString() || '',
            semesterOfStudy: data.semesterOfStudy?.toString() || '',
          });
          setIsLoading(false);
        } catch (err) {
          setError('Failed to fetch module data.');
          setIsLoading(false);
        }
      };
      fetchModule();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/lead/modules/${id}`, {
        ...formData,
        version: parseInt(formData.version),
        yearOfStudy: parseInt(formData.yearOfStudy),
        semesterOfStudy: parseInt(formData.semesterOfStudy),
      });
      setSuccess(`Module '${response.data.title}' updated successfully!`);
      setTimeout(() => router.back(), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while updating the module.');
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-card rounded-xl shadow-lg p-8">
            <button onClick={() => router.back()} className="mb-4 text-foreground hover:text-primary">
                <ArrowLeftIcon className="h-6 w-6" />
            </button>
          <header className="mb-8">
            <h1 className="text-4xl font-extrabold text-foreground">Edit Module</h1>
            <p className="mt-2 text-xl text-muted-foreground">Update the details for this module.</p>
          </header>

          <form onSubmit={handleSubmit}>
            {error && <div className="bg-destructive/20 border-l-4 border-destructive text-destructive-foreground p-4 mb-6" role="alert"><p>{error}</p></div>}
            {success && <div className="bg-green-500/20 border-l-4 border-green-500 text-green-500 p-4 mb-6" role="alert"><p>{success}</p></div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form fields from create-module, adapted for editing */}
              <div>
                <label htmlFor="title" className="block text-lg font-semibold text-foreground mb-2">Module Title</label>
                <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-3 border border-border rounded-lg" required />
              </div>
              <div>
                <label htmlFor="moduleCode" className="block text-lg font-semibold text-foreground mb-2">Module Code</label>
                <input type="text" name="moduleCode" id="moduleCode" value={formData.moduleCode} onChange={handleChange} className="w-full px-4 py-3 border border-border rounded-lg" required />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-lg font-semibold text-foreground mb-2">Description</label>
                <textarea id="description" name="description" rows="5" value={formData.description} onChange={handleChange} className="w-full px-4 py-3 border border-border rounded-lg"></textarea>
              </div>
              <div>
                <label htmlFor="yearOfStudy" className="block text-lg font-semibold text-foreground mb-2">Year of Study</label>
                <input type="number" name="yearOfStudy" id="yearOfStudy" value={formData.yearOfStudy} onChange={handleChange} className="w-full px-4 py-3 border border-border rounded-lg" />
              </div>
              <div>
                <label htmlFor="semesterOfStudy" className="block text-lg font-semibold text-foreground mb-2">Semester of Study</label>
                <input type="number" name="semesterOfStudy" id="semesterOfStudy" value={formData.semesterOfStudy} onChange={handleChange} className="w-full px-4 py-3 border border-border rounded-lg" />
              </div>
              <div>
                <label htmlFor="version" className="block text-lg font-semibold text-foreground mb-2">Version</label>
                <input type="number" name="version" id="version" value={formData.version} onChange={handleChange} className="w-full px-4 py-3 border border-border rounded-lg" />
              </div>
              <div>
                <label htmlFor="status" className="block text-lg font-semibold text-foreground mb-2">Status</label>
                <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 border border-border rounded-lg">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DEPRECATED">Deprecated</option>
                </select>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-end gap-4">
              <button type="button" onClick={() => router.back()} className="bg-muted hover:bg-muted/80 text-foreground font-bold py-3 px-6 rounded-lg">Cancel</button>
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
  );
};

export default EditModulePage;