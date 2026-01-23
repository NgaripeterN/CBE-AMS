import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../lib/api";
import ThemeSwitcher from "../components/ThemeSwitcher";

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing password reset token.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { data } = await api.post("/auth/reset-password", { token, password });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred.");
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Reset Password - CBE-AMS</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
        <header className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border-b border-gray-100 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold text-slate-800 dark:text-white">CBE-AMS Platform</Link>
            <ThemeSwitcher />
          </div>
        </header>
        <main className="flex-grow flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700"
          >
            <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white">Reset Password</h1>
            {message ? (
              <div className="text-center">
                <p className="text-green-600 dark:text-green-400">{message}</p>
                <Link href="/login" className="mt-4 inline-block text-sm text-primary hover:underline dark:text-primary">Back to Login</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
                {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
                <div>
                  <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </main>
      </div>
    </>
  );
}
