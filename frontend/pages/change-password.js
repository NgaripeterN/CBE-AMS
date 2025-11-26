import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon, KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState(null);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const { changePassword, user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }
    try {
      await changePassword({ currentPassword: oldPassword, newPassword });
      // On success, the AuthContext will handle logout and redirect
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'An unexpected error occurred.';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-card rounded-2xl shadow-2xl flex overflow-hidden">
        <div className="w-1/2 hidden md:block bg-primary p-12 flex flex-col justify-between">
            <h1 className="text-4xl font-extrabold text-primary-foreground mb-4">Update Your Security</h1>
            <p className="text-primary-foreground/80 text-lg">For your security, you must change your temporary password before you can proceed.</p>
            <div className="mt-auto">
                <ShieldCheckIcon className="w-48 h-48 text-primary-foreground/20" />
            </div>
        </div>
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-foreground mb-2">Change Your Password</h1>
          <p className="text-muted-foreground mb-8">Please enter your old and new passwords.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {user && !user.mustChangePassword && (
              <div className="relative">
                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="oldPassword"
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Current Password"
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-lg border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
                />
                <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showOldPassword ? <EyeSlashIcon className="w-5 h-5 text-muted-foreground" /> : <EyeIcon className="w-5 h-5 text-muted-foreground" />}
                </button>
              </div>
            )}

            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                required
                className="w-full pl-10 pr-10 py-3 rounded-lg border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showNewPassword ? <EyeSlashIcon className="w-5 h-5 text-muted-foreground" /> : <EyeIcon className="w-5 h-5 text-muted-foreground" />}
              </button>
            </div>

            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="confirmNewPassword"
                type={showConfirmNewPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm New Password"
                required
                className="w-full pl-10 pr-10 py-3 rounded-lg border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
              />
              <button type="button" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showConfirmNewPassword ? <EyeSlashIcon className="w-5 h-5 text-muted-foreground" /> : <EyeIcon className="w-5 h-5 text-muted-foreground" />}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border-l-4 border-red-500 text-red-700 p-4 rounded-md dark:bg-red-500/20 dark:text-red-400" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out hover:scale-105"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
