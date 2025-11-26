import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import toast from 'react-hot-toast';
import { getAssessors, createAssessor, updateAssessor, deleteAssessor } from '../lib/api';
import { customStyles } from '../styles/react-select-styles';
import { PlusIcon, PencilIcon, TrashIcon, ArrowUpTrayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

const AssessorManagement = () => {
  const [assessors, setAssessors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAssessor, setCurrentAssessor] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', department: '', tempPassword: '' });
  const { theme } = useTheme();
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [assessorOptions, setAssessorOptions] = useState([]);

  const fetchAssessors = useCallback(async () => {
    try {
      const data = await getAssessors(searchQuery, page, limit);
      setAssessors(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    }
  }, [searchQuery, page, limit]);

  useEffect(() => {
    fetchAssessors();
  }, [fetchAssessors]);

  useEffect(() => {
    const options = assessors.map(assessor => ({
      value: assessor.user.user_id,
      label: `${assessor.user.name} (${assessor.user.email})`
    }));
    setAssessorOptions(options);
  }, [assessors]);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email || !formData.department) {
      setError('Please fill in all fields.');
      return;
    }

    if (!currentAssessor && !formData.tempPassword) {
      setError('Please provide a temporary password for the new assessor.');
      return;
    }

    const promise = currentAssessor
      ? updateAssessor(currentAssessor.user.user_id, formData)
      : createAssessor(formData);

    toast.promise(promise, {
      loading: 'Saving assessor...',
      success: (res) => {
        fetchAssessors();
        setIsModalOpen(false);
        return currentAssessor ? 'Assessor updated successfully.' : 'Assessor created successfully.';
      },
      error: (err) => {
        setError(err.message);
        return 'Failed to save assessor.';
      },
    });
  };

  const openModal = (assessor = null) => {
    setCurrentAssessor(assessor);
    setFormData(assessor ? { name: assessor.user.name, email: assessor.user.email, department: assessor.user.department } : { name: '', email: '', department: '', tempPassword: '' });
    setIsModalOpen(true);
    setError(null);
  };

  const handleDelete = async (id) => {
    setIsDeleteModalOpen(true);
    setCurrentAssessor(assessors.find(a => a.user.user_id === id));
  };

  const confirmDelete = async () => {
    if (!currentAssessor) return;

    const promise = deleteAssessor(currentAssessor.user.user_id);

    toast.promise(promise, {
      loading: 'Deleting assessor...',
      success: () => {
        fetchAssessors();
        setIsDeleteModalOpen(false);
        setCurrentAssessor(null);
        return 'Assessor deleted successfully.';
      },
      error: (err) => {
        setError(err.message);
        return 'Failed to delete assessor.';
      },
    });
  };

  return (
    <>
      <div className="mb-6">
        <button onClick={() => router.push('/admin/users')} className="inline-flex items-center px-4 py-2 bg-muted text-muted-foreground rounded-md shadow-sm hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring">
          <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
          Back
        </button>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Assessor Management</h1>
        <div className="flex gap-4">
          <Link href="/admin/import-users" legacyBehavior>
            <a className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md shadow-sm hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary">
              <ArrowUpTrayIcon className="-ml-1 mr-2 h-5 w-5" />
              Import Assessors
            </a>
          </Link>
          <button onClick={() => openModal()} className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Assessor
          </button>
        </div>
      </div>
      <div className="mb-4">
        <Select
          styles={customStyles}
          options={assessorOptions}
          onChange={option => setSearchQuery(option ? option.label : '')}
          onInputChange={inputValue => setSearchQuery(inputValue)}
          isClearable
          placeholder="Search for an assessor..."
        />
      </div>
      {error && <p className="text-destructive mb-4">{error}</p>}
      <div className="bg-card shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assessors.map((assessor) => (
              assessor.user && (
                <tr key={assessor.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{assessor.user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{assessor.user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{assessor.user.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openModal(assessor)} className="text-primary hover:text-primary/90 mr-4">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(assessor.user.user_id)} className="text-destructive hover:text-destructive/90">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div>
          <span className="text-sm text-muted-foreground">
            Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total} results
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="inline-flex items-center px-4 py-2 bg-muted text-muted-foreground rounded-md shadow-sm hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page * limit >= total}
            className="inline-flex items-center px-4 py-2 bg-muted text-muted-foreground rounded-md shadow-sm hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium leading-6 text-foreground">{currentAssessor ? 'Edit Assessor' : 'Add Assessor'}</h3>
            {error && <p className="text-destructive mt-2">{error}</p>}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="Name" className="w-full p-2 border rounded bg-input text-foreground border-border" />
              <input type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="Email" className="w-full p-2 border rounded bg-input text-foreground border-border" />
              <input type="text" name="department" value={formData.department} onChange={handleFormChange} placeholder="Department" className="w-full p-2 border rounded bg-input text-foreground border-border" />
              {!currentAssessor && (
                <input type="password" name="tempPassword" value={formData.tempPassword} onChange={handleFormChange} placeholder="Temporary Password" className="w-full p-2 border rounded bg-input text-foreground border-border" />
              )}
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
              <p>Are you sure you want to delete the assessor &quot;{currentAssessor?.user.name}&quot;?</p>
              <p className="text-sm text-muted-foreground">This action is irreversible and will result in the following:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>All associated course and module assignments will be deleted.</li>
                <li>All enrollments associated with this assessor will be removed.</li>
              </ul>
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

export default AssessorManagement;