import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import { useAuth } from '../../contexts/AuthContext';

const ManageAssessments = () => {
  const router = useRouter();
  const { module_id } = router.query;
  const { user } = useAuth();

  // Initialize assessments to null to distinguish between 'not loaded yet' and 'loaded but empty'
  const [assessments, setAssessments] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true to show loading initially
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  useEffect(() => {
    // Condition: Proceed with fetch ONLY if all dependencies are ready.
    // This implicitly waits for user?.assessor?.id to be defined, which covers auth completion
    // for this component's specific needs.
    if (!router.isReady || !module_id || !user?.assessor?.id) {
      setIsLoading(true); // Keep showing loading while user data resolves (or other deps are missing)
      return; // Exit early, useEffect will re-run when dependencies change
    }

    setIsLoading(true); // Ensure loading is true before fetch starts
    setError(''); // Clear any previous errors before a new fetch

    const controller = new AbortController(); // For cleanup on unmount/re-run

    const fetchAssessments = async () => {
      try {
        const res = await api.get(`/assessor/modules/${module_id}/assessments`, {
          params: {
            creatorId: user.assessor.id,
          },
          signal: controller.signal
        });
        setAssessments(res.data);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Failed to fetch assessments:', err);
        setError('Failed to fetch assessments.');
        setAssessments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();

    return () => {
      controller.abort();
    };

  }, [router.isReady, module_id, user?.assessor?.id]);

  const handleEdit = (assessmentId) => router.push(`/assessor/edit-assessment/${assessmentId}`);

  const handleDelete = (assessmentId) => {
    setSelectedAssessment(assessmentId);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/assessor/assessments/${selectedAssessment}`);
      // Optimistically update the UI, then re-fetch or filter locally
      setAssessments(prevAssessments =>
        prevAssessments ? prevAssessments.filter(a => a.assessment_id !== selectedAssessment) : []
      );
      // Optionally re-fetch: await fetchAssessments();
    } catch (err) {
      console.error(err);
      setError('Failed to delete assessment.');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center px-4 py-2 ...">
        &larr; Back
      </button>

      <h1 className="text-3xl font-bold mb-6 text-foreground">Manage Assessments</h1>

      {/* show a clear loading state while we haven't fetched yet */}
      {isLoading && <p>Loading assessments...</p>}
      {error && <p className="text-destructive-foreground bg-destructive/20 p-3 rounded-md mb-4">{error}</p>}

      {/* only render the table or "no assessments" message if not loading AND assessments is not null */}
      {!isLoading && assessments !== null && (
        <div className="bg-card shadow-sm rounded-lg">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Group</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Deadline</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {assessments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-muted-foreground">No assessments found for this module.</td>
                </tr>
              ) : (
                assessments.map(a => (
                  <tr key={a.assessment_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{a.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{a.group}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{a.deadline ? new Date(a.deadline).toLocaleString() : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(a.assessment_id)} className="text-primary mr-4">Edit</button>
                      <button onClick={() => handleDelete(a.assessment_id)} className="text-destructive">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {isModalOpen && <ConfirmDeleteModal onConfirm={confirmDelete} onClose={() => setIsModalOpen(false)} title="Confirm Assessment Deletion" message="Are you sure you want to delete this assessment? This action cannot be undone." />}
    </div>
  );
};

export default ManageAssessments;