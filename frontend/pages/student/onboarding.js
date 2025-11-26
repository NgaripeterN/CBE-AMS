import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { useRouter } from 'next/router';
import { ShieldCheckIcon, UserIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import TermsOfUseModal from '../../components/TermsOfUseModal';

const OnboardingPage = () => {
  const { user, fetchUser } = useAuth();
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleCompleteOnboarding = async () => {
    if (!consent) {
      setError('You must provide consent to continue.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await api.post('/student/complete-onboarding');
      await fetchUser(); // Refresh user data
      router.push('/student'); // Redirect to the student dashboard
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <TermsOfUseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-lg">
          <div className="text-center">
            <ShieldCheckIcon className="mx-auto h-12 w-auto text-blue-600" />
            <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
              Confirm Your Details
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Please verify your information below to activate your account.
            </p>
          </div>

          <div className="space-y-6">
            <div className="relative bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center">
                <UserIcon className="h-6 w-6 text-gray-500 mr-4" />
                <div>
                  <label className="block text-xs font-medium text-gray-500">Name</label>
                  <p className="text-lg font-semibold text-gray-800">{user?.name || 'Loading...'}</p>
                </div>
              </div>
            </div>
            <div className="relative bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center">
                <AcademicCapIcon className="h-6 w-6 text-gray-500 mr-4" />
                <div>
                  <label className="block text-xs font-medium text-gray-500">Program</label>
                  <p className="text-lg font-semibold text-gray-800">{user?.program || 'Loading...'}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-start my-6">
              <div className="flex items-center h-5">
                <input
                  id="consent"
                  name="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={() => setConsent(!consent)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="consent" className="font-medium text-gray-700">
                  I confirm the details above are correct and agree to the{' '}
                  <button onClick={() => setIsModalOpen(true)} className="font-semibold text-blue-600 hover:text-blue-700 underline focus:outline-none">
                    Terms of Use
                  </button>
                  .
                </label>
              </div>
            </div>

            {error && <p className="text-center text-sm text-red-600 mb-4">{error}</p>}

            <button
              onClick={handleCompleteOnboarding}
              disabled={!consent || loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Activating...' : 'Confirm and Continue'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingPage;
