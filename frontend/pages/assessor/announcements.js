import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import EditAnnouncementModal from '../../components/EditAnnouncementModal';

const Announcements = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [announcementToEdit, setAnnouncementToEdit] = useState(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await api.get('/assessor/modules');
        setModules(res.data.modules);
      } catch (err) {
        setError('Failed to fetch modules.');
      }
    };
    fetchModules();
  }, []);

  useEffect(() => {
    const { moduleId } = router.query;
    if (moduleId) {
      setSelectedModule(moduleId);
    }
  }, [router.query]);

  useEffect(() => {
    if (selectedModule) {
      const fetchAnnouncements = async () => {
        try {
          const res = await api.get(`/announcements/${selectedModule}`);
          setAnnouncements(res.data);
        } catch (err) {
          setError('Failed to fetch announcements.');
        }
      };
      fetchAnnouncements();
    }
  }, [selectedModule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedModule || !title || !content) {
      setError('Please select a module, and provide a title and content for the announcement.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/announcements', { title, content, moduleId: selectedModule });
      setSuccess('Announcement created successfully!');
      setTitle('');
      setContent('');
      // Refresh announcements
      const res = await api.get(`/announcements/${selectedModule}`);
      setAnnouncements(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while creating the announcement.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/announcements/${announcementToDelete.id}`);
      setAnnouncements(announcements.filter(a => a.id !== announcementToDelete.id));
      setIsDeleteModalOpen(false);
      setAnnouncementToDelete(null);
    } catch (err) {
      setError('Failed to delete announcement.');
    }
  };

  const handleUpdate = async ({ title, content }) => {
    try {
      const res = await api.put(`/announcements/${announcementToEdit.id}`, { title, content });
      setAnnouncements(announcements.map(a => a.id === announcementToEdit.id ? res.data : a));
      setIsEditModalOpen(false);
      setAnnouncementToEdit(null);
    } catch (err) {
      setError('Failed to update announcement.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        &larr; Back
      </button>
      <h1 className="text-3xl font-bold mb-6 text-foreground">Announcements</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-card rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Create Announcement</h2>
            <form onSubmit={handleSubmit}>
              {error && <p className="text-destructive-foreground bg-destructive/20 p-3 rounded-md mb-4">{error}</p>}
              {success && <p className="text-green-500 bg-green-500/20 p-3 rounded-md mb-4">{success}</p>}

              <div className="mb-4">
                <label htmlFor="module" className="block text-foreground font-semibold mb-2">Module</label>
                <select
                  id="module"
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background border-border"
                  required
                >
                  <option value="">Select a module</option>
                  {modules.map(module => (
                    <option key={module.module_id} value={module.module_id}>{module.title}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="title" className="block text-foreground font-semibold mb-2">Title</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background border-border"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="content" className="block text-foreground font-semibold mb-2">Content</label>
                <textarea
                  id="content"
                  rows="5"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background border-border"
                  required
                ></textarea>
              </div>

              <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Announcement'}
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-card rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Announcements for {modules.find(m => m.module_id === selectedModule)?.title}</h2>
            {announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map(announcement => {
                  return (
                  <div key={announcement.id} className="border-l-4 border-primary p-4 bg-muted/50 rounded-r-lg">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg text-foreground">{announcement.title}</h3>
                      {user && announcement.assessor && user.userId === announcement.assessor.user.id && (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              setAnnouncementToEdit(announcement);
                              setIsEditModalOpen(true);
                            }}
                            className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => {
                              setAnnouncementToDelete(announcement);
                              setIsDeleteModalOpen(true);
                            }}
                            className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">By {announcement.assessor?.user.name} on {new Date(announcement.createdAt).toLocaleDateString()}</p>
                    <p className="mt-2 text-foreground">{announcement.content}</p>
                  </div>
                )})}
              </div>
            ) : (
              <p className="text-muted-foreground">No announcements for this module yet.</p>
            )}
          </div>
        </div>
      </div>
      {isDeleteModalOpen && <ConfirmDeleteModal
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action cannot be undone."
      />}
      <EditAnnouncementModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onConfirm={handleUpdate}
        announcement={announcementToEdit}
      />
    </div>
  );
};

export default Announcements;
