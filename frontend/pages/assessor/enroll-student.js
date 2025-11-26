import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';
import { ArrowUpOnSquareIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const EnrollStudent = () => {
  const router = useRouter();
  const { offeringId } = router.query;

  const [studentEmail, setStudentEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!studentEmail) {
      setError('Student Email is required.');
      return;
    }

    try {
      const response = await api.post('/enrollments', {
        offeringId,
        studentEmail,
      });
      setSuccess(`Successfully enrolled ${studentEmail} in the module.`);
      setStudentEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while enrolling the student.');
    }
  };

  return (
    
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Enroll Student</h1>
          <Link href={`/assessor/bulk-enroll?offeringId=${offeringId}`} passHref legacyBehavior>
            <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <ArrowUpOnSquareIcon className="h-5 w-5 mr-2" />
              Bulk Import via CSV
            </a>
          </Link>
        </div>
        <div className="max-w-xl mx-auto bg-card rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit}>
            {error && <p className="text-destructive-foreground bg-destructive/20 p-3 rounded-md mb-4">{error}</p>}
            {success && <p className="text-green-500 bg-green-500/20 p-3 rounded-md mb-4">{success}</p>}

            <p className="mb-4 text-muted-foreground">Enter the email address of the student you wish to enroll in this module.</p>
            
            <div className="mb-4">
              <label htmlFor="studentEmail" className="block text-foreground font-semibold mb-2">Student Email</label>
              <input
                type="email"
                id="studentEmail"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background border-border"
                required
                placeholder="student@example.com"
              />
            </div>

            <div className="flex items-center justify-end">
              <button type="button" onClick={() => router.back()} className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-4 rounded-lg mr-2">Cancel</button>
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg">Enroll Student</button>
            </div>
          </form>
        </div>
      </div>
    
  );
};

export default EnrollStudent;