import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import Loading from '../../components/Loading';
import Link from 'next/link';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import ErrorModal from '../../components/ErrorModal';
import CompetencySelector from '../../components/CompetencySelector';

const CreateModulePage = () => {
  const router = useRouter();
  const { course_id } = router.query;
  const [isLoading, setIsLoading] = useState(true);

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
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [courseCompetencies, setCourseCompetencies] = useState([]);
  const [selectedCompetencyIds, setSelectedCompetencyIds] = useState([]);

  useEffect(() => {
    if (router.isReady && course_id) {
      const fetchCourseData = async () => {
        try {
          const res = await api.get(`/lead/courses/${course_id}`); // This should fetch course with its competencies
          setCourseCompetencies(res.data.competencies || []); // Correctly set competencies from the course
        } catch (err) {
          setError('Failed to fetch course competencies.');
          setIsErrorModalOpen(true);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCourseData();
    } else if (router.isReady) {
      setIsLoading(false);
    }
  }, [router.isReady, course_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsErrorModalOpen(false);

    if (!course_id) {
      setError('Course ID is missing. Please go back and try again.');
      setIsErrorModalOpen(true);
      return;
    }

    if (!formData.moduleCode || !formData.title) {
      setError('Module Code and Title are required.');
      setIsErrorModalOpen(true);
      return;
    }

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
      const response = await api.post('/lead/create-module', {
        course_id: course_id,
        ...formData,
        yearOfStudy: year,
        semesterOfStudy: semester,
        competencyIds: selectedCompetencyIds, // Include selected competencies
      });
      toast.success(`Module '${response.data.title}' created successfully!`);
      setFormData({ moduleCode: '', title: '', description: '', version: '1', status: 'DRAFT', yearOfStudy: '1', semesterOfStudy: '1' });
      setSelectedCompetencyIds([]); // Clear selected competencies
      setTimeout(() => router.push(`/assessor/course-management/${course_id}`), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while creating the module.');
      setIsErrorModalOpen(true);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Fragment>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl mx-auto bg-card rounded-xl shadow-lg p-4">
          <header className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create a New Module</h1>
              <p className="mt-1 text-md text-muted-foreground">Fill in the details below to create a new module for your course.</p>
            </div>
            <Link href={`/assessor/import-modules?course_id=${course_id}`} passHref legacyBehavior>
              <a className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center">
                <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                Import Modules
              </a>
            </Link>
          </header>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-base font-semibold text-foreground mb-2">Module Title</label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-shadow bg-background"
                  required
                />
              </div>
              <div>
                <label htmlFor="moduleCode" className="block text-base font-semibold text-foreground mb-2">Module Code</label>
                <input
                  type="text"
                  name="moduleCode"
                  id="moduleCode"
                  value={formData.moduleCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-shadow bg-background"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-base font-semibold text-foreground mb-2">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-shadow bg-background"
                ></textarea>
              </div>
              <div>
                <label htmlFor="yearOfStudy" className="block text-base font-semibold text-foreground mb-2">Year of Study</label>
                <input
                  type="number"
                  name="yearOfStudy"
                  id="yearOfStudy"
                  value={formData.yearOfStudy}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-shadow bg-background"
                />
              </div>
              <div>
                <label htmlFor="semesterOfStudy" className="block text-base font-semibold text-foreground mb-2">Semester of Study</label>
                <input
                  type="number"
                  name="semesterOfStudy"
                  id="semesterOfStudy"
                  value={formData.semesterOfStudy}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-shadow bg-background"
                />
              </div>
              <div>
                <label htmlFor="version" className="block text-base font-semibold text-foreground mb-2">Version</label>
                <input
                  type="number"
                  name="version"
                  id="version"
                  value={formData.version}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-shadow bg-background"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-base font-semibold text-foreground mb-2">Status</label>
                <select
                  name="status"
                  id="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-shadow bg-background"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DEPRECATED">Deprecated</option>
                </select>
              </div>
            </div>

            <div className="mt-6 md:col-span-2">
              <h2 className="text-xl font-bold text-foreground mb-2">Associate Competencies</h2>
              <p className="text-muted-foreground mb-4">Select competencies relevant to this module.</p>
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
                className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-4 rounded-lg transition-colors duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg transition-colors duration-300 shadow-lg hover:shadow-xl"
              >
                Create Module
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

export default CreateModulePage;
