import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Select from 'react-select';
import { customStyles } from '../../styles/react-select-styles';
import { PlusIcon, PencilIcon, TrashIcon, ArrowLeftIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

const CompetencyManagement = () => {
  const [competencies, setCompetencies] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCompetency, setCurrentCompetency] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', category: '', courseIds: [] });
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchCompetencies = useCallback(async () => {
    try {
      const res = await api.get('/competencies');
      setCompetencies(res.data);
    } catch (err) {
      setError(err.message);
    }
  }, []);
  
  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.get('/admin/courses'); // Assuming an endpoint to get all courses
      setAllCourses(res.data.data);
    } catch (err) {
      toast.error("Failed to fetch courses.");
    }
  }, []);

  useEffect(() => {
    fetchCompetencies();
    fetchCourses();
  }, [fetchCompetencies, fetchCourses]);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleCourseSelectChange = (selectedOptions) => {
    setFormData({ ...formData, courseIds: selectedOptions ? selectedOptions.map(o => o.value) : [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, category, courseIds } = formData;
    if (!name || !category) {
      toast.error('Name and Category are required.');
      return;
    }

    const payload = { ...formData, courseIds };
    const promise = currentCompetency
      ? api.put(`/competencies/${currentCompetency.id}`, payload)
      : api.post('/competencies', payload);

    toast.promise(promise, {
      loading: 'Saving competency...',
      success: () => {
        fetchCompetencies();
        setIsModalOpen(false);
        return currentCompetency ? 'Competency updated successfully.' : 'Competency created successfully.';
      },
      error: (err) => {
        return err.response?.data?.error || 'Failed to save competency.';
      },
    });
  };

  const openModal = (competency = null) => {
    setCurrentCompetency(competency);
    setFormData({
      name: competency ? competency.name : '',
      description: competency ? competency.description : '',
      category: competency ? competency.category : '',
      courseIds: competency && competency.courses ? competency.courses.map(c => c.course_id) : [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = (competency) => {
    setCurrentCompetency(competency);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentCompetency) return;

    const promise = api.delete(`/competencies/${currentCompetency.id}`);

    toast.promise(promise, {
      loading: 'Deleting competency...',
      success: () => {
        fetchCompetencies();
        setIsDeleteModalOpen(false);
        setCurrentCompetency(null);
        return 'Competency deleted successfully.';
      },
      error: (err) => {
        return err.response?.data?.error || 'Failed to delete competency.';
      },
    });
  };

  const categories = [...new Set(competencies.map(c => c.category))].map(c => ({ value: c, label: c }));
  const courseOptions = allCourses.map(c => ({ value: c.course_id, label: `${c.name} (${c.code})`}));

  const filteredCompetencies = competencies.filter(c => {
    const searchMatch = (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    const categoryMatch = selectedCategory ? c.category === selectedCategory.value : true;
    return searchMatch && categoryMatch;
  });

  return (
    <>
      <div className="mb-6">
        <button onClick={() => router.back()} className="inline-flex items-center px-4 py-2 bg-muted text-muted-foreground rounded-md shadow-sm hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring">
          <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
          Back
        </button>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Competency Management</h1>
        <div className="flex gap-4">
          <Link href="/admin/import-competencies" legacyBehavior>
            <a className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md shadow-sm hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary">
              <ArrowUpTrayIcon className="-ml-1 mr-2 h-5 w-5" />
              Import Competencies
            </a>
          </Link>
          <button onClick={() => openModal()} className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Competency
          </button>
        </div>
      </div>
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a competency..."
          className="w-1/2 p-2 border rounded bg-input text-foreground border-border"
        />
        <Select
          options={categories}
          isClearable
          placeholder="Filter by category..."
          onChange={setSelectedCategory}
          value={selectedCategory}
          styles={customStyles}
          className="w-1/2"
        />
      </div>
      {error && <p className="text-destructive mb-4">{error}</p>}
      <div className="bg-card shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Associated Courses</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredCompetencies.map((competency) => (
              <tr key={competency.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{competency.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{competency.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {competency.courses?.map(c => c.name).join(', ') || 'None'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal(competency)} className="text-primary hover:text-primary/90 mr-4">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDelete(competency)} className="text-destructive hover:text-destructive/90">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium leading-6 text-foreground">{currentCompetency ? 'Edit Competency' : 'Add Competency'}</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="Competency Name" className="w-full p-2 border rounded bg-input text-foreground border-border" />
              <input type="text" name="category" value={formData.category} onChange={handleFormChange} placeholder="Category" className="w-full p-2 border rounded bg-input text-foreground border-border" />
              <textarea name="description" value={formData.description || ''} onChange={handleFormChange} placeholder="Description (optional)" className="w-full p-2 border rounded bg-input text-foreground border-border" rows="3"></textarea>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Associated Courses</label>
                <Select
                  isMulti
                  options={courseOptions}
                  styles={customStyles}
                  value={courseOptions.filter(o => formData.courseIds.includes(o.value))}
                  onChange={handleCourseSelectChange}
                  placeholder="Select courses..."
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium leading-6 text-destructive">Confirm Deletion</h3>
            <div className="mt-4 space-y-4">
              <p>Are you sure you want to delete the competency &quot;{currentCompetency?.name}&quot;?</p>
              <p className="text-sm text-muted-foreground">This action is irreversible.</p>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80">Cancel</button>
              <button type="button" onClick={confirmDelete} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompetencyManagement;
