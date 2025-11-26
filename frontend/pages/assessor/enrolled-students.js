import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import ConfirmUnenrollModal from '../../components/ConfirmUnenrollModal';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const EnrolledStudents = () => {
  const router = useRouter();
  const { module_id } = router.query;

  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      if (module_id) {
        try {
          const res = await api.get(`/modules/${module_id}/students`);
          setEnrollments(res.data);
        } catch (err) {
          setError('Failed to fetch enrolled students.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchStudents();
  }, [module_id]);

  const handleUnenroll = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsModalOpen(true);
  };

  const confirmUnenroll = async () => {
    try {
      await api.delete(`/assessor/enrollments/${selectedEnrollment.id}`);
      setEnrollments(enrollments.filter(e => e.id !== selectedEnrollment.id));
    } catch (err) {
      setError('Failed to unenroll student.');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-4 rounded-lg flex items-center transition-colors mr-4">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Go Back
        </button>
        <h1 className="text-3xl font-bold text-foreground">Enrolled Students</h1>
      </div>
      {isLoading && <p>Loading students...</p>}
      {error && <p className="text-destructive-foreground bg-destructive/20 p-3 rounded-md mb-4">{error}</p>}

      <div className="bg-card shadow-sm rounded-lg">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Program</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{enrollment.student.user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{enrollment.student.user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{enrollment.student.user.program}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleUnenroll(enrollment)} className="text-destructive hover:text-destructive/80">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && <ConfirmUnenrollModal studentName={selectedEnrollment.student.user.name} onConfirm={confirmUnenroll} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default EnrolledStudents;
