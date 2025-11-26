import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import api from "../lib/api";
import ThemeSwitcher from "../components/ThemeSwitcher";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred.");
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Forgot Password - CBE-AMS</title>
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
            <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white">Forgot Password</h1>
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">Enter your email address and we will send you a link to reset your password.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              {message && <p className="text-green-600 dark:text-green-400 text-sm">{message}</p>}
              {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
            <div className="text-center">
              <Link href="/login" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">Back to Login</Link>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
}
