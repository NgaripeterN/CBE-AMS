import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import OnboardingNav from "../components/OnboardingNav";
import useTypingAnimation from "../hooks/useTypingAnimation";
import FeatureHighlight from "../components/FeatureHighlight";

export default function OnboardingPage() {
  const router = useRouter();
  const animatedText = useTypingAnimation("Welcome to CBE-AMS");

  const handleGetStarted = () => {
    // navigate to change password (or the real first step)
    router.push("/login");
  };

  return (
    <>
      <Head>
        <title>Welcome • CBE-AMS</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
        <OnboardingNav />

        {/* Main content */}
        <main className="flex-grow flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-7xl">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
              {/* Left */}
              <div className="p-16 md:p-20 flex flex-col justify-center gap-6">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                  {animatedText}
                </h1>

                <p className="text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                  A secure digital assessment and credentialing platform. Credentials are issued
                  and verifiable on-chain, making learner achievements portable and tamper-resistant.
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4">
                  <button
                    onClick={handleGetStarted}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition w-full sm:w-auto"
                  >
                    Get started
                  </button>

                  <Link
                    href="/about"
                    className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition w-full sm:w-auto"
                  >
                    Learn more
                  </Link>
                </div>

                {/* short feature highlights */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                  <FeatureHighlight
                    title="Verified credentials"
                    description="Issuance & verification on blockchain"
                  />
                  <FeatureHighlight
                    title="Secure assessments"
                    description="Robust grading and audit trails"
                  />
                </div>
              </div>

              {/* Right: badge image card */}
              <div className="relative p-16 md:p-20 flex items-center justify-center bg-gradient-to-b from-slate-50/60 to-white/40 dark:from-slate-900/40 dark:to-slate-900/25">
                <div className="w-full max-w-md rounded-xl border border-slate-200/40 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60 p-6 flex items-center justify-center shadow-inner">
                  <Image
                    src="/images/certificate-illustration.png"
                    alt="Platform certificate badge"
                    width={500}
                    height={380}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6">
          <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} CBE-AMS. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}