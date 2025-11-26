import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import ThemeSwitcher from "../components/ThemeSwitcher";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.error || "Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - CBE-AMS</title>
        <meta name="description" content="Sign in to CBE-AMS" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 flex flex-col">
        {/* Header */}
        <header className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-b border-transparent dark:border-slate-700">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center px-4 py-2 rounded-md bg-purple-600 text-white text-sm font-medium shadow hover:bg-purple-700 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
            </div>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              {/* Left: brand + short info */}
              <div className="hidden md:flex flex-col gap-6 pl-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center shadow-md">
                    <span className="text-white font-bold">C</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">CBE-AMS</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-300">Digital Assessment & Credential Platform</p>
                  </div>
                </div>

                <div className="bg-white/90 dark:bg-slate-800/90 border border-gray-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Sign in to manage credentials, assessments and reports.
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold">✓</div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">Secure</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Privacy-first design</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">🔒</div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">Verified</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Blockchain anchored proofs</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: login card */}
              <div className="mx-auto w-full">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-8">
                  <div className="text-center">
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Sign in</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Use your account to access the dashboard</p>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                      <div className="mt-1 relative rounded-md">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M2.25 6.75A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0119.5 19.5h-15A2.25 2.25 0 012.25 17.25V6.75z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M3.75 6.75l8.25 6.75L20.25 6.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>

                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-11 pr-3 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>

                      <div className="mt-1 relative rounded-md">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <rect x="3.5" y="10.5" width="17" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8.5 10.5V8.25a3.5 3.5 0 017 0V10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>

                        <input
                          id="password"
                          name="password"
                          type={showPwd ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full pl-11 pr-12 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          placeholder="••••••••"
                          autoComplete="current-password"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPwd((s) => !s)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white"
                          aria-label={showPwd ? "Hide password" : "Show password"}
                        >
                          {showPwd ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    {/* error */}
                    {error && (
                      <div role="alert" aria-live="assertive" className="text-sm text-red-600 dark:text-red-400">
                        {error}
                      </div>
                    )}

                    {/* actions */}
                    <div className="flex items-center justify-end">
                      <div className="text-sm">
                        <Link href="/forgot-password" className="font-medium text-purple-600 hover:underline dark:text-blue-400">Forgot password?</Link>
                      </div>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`w-full inline-flex justify-center items-center px-4 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                          loading ? "bg-purple-500 cursor-wait" : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        }`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                            Signing in...
                          </>
                        ) : (
                          "Sign in"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
