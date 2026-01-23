import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import ThemeSwitcher from "../components/ThemeSwitcher";
import Link from "next/link";
import Loading from "../components/Loading";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();
  const { verifyOtp, resendOtp } = useAuth();
  const email = router.query.email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, e.target.otp.value);
      setVerifying(true);
    } catch (err) {
      setError(err.error || "Invalid or expired OTP");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");
    try {
      await resendOtp(email);
    } catch (err) {
      setError(err.error || "Could not resend OTP");
    }
    setResendLoading(false);
  };

  if (verifying) {
    return <Loading />;
  }

  return (
    <>
      <Head>
        <title>Verify OTP - CBE-AMS</title>
        <meta name="description" content="Verify your OTP to sign in to CBE-AMS" />
      </Head>

      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-b border-transparent dark:border-slate-700">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow hover:bg-primary/90 transition">
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
          <div className="w-full max-w-md">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-8">
              <div className="text-center">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Enter OTP</h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">A 6-digit OTP has been sent to {email}</p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                {/* OTP */}
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">One-Time Password</label>
                  <div className="mt-1 relative rounded-md">
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="block w-full pr-3 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="123456"
                    />
                  </div>
                </div>

                {/* error */}
                {error && (
                  <div role="alert" aria-live="assertive" className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full inline-flex justify-center items-center px-4 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                      loading ? "bg-primary/70 cursor-wait" : "bg-primary hover:bg-primary/90"
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-sm font-medium text-primary hover:underline dark:text-primary"
                >
                  {resendLoading ? "Resending..." : "Resend OTP"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}