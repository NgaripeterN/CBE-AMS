import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import OnboardingNav from "../components/OnboardingNav";

const apiLoginExample = `POST /api/auth/login
{
  "email": "user@example.com",
  "password": "your-password"
}`;

const sections = {
  "getting-started": {
    title: "Getting Started",
    content: (
      <>
        <h2 className="text-2xl font-bold mb-4">Introduction</h2>
        <p className="mb-4">
          Welcome to the CBE-AMS documentation. This guide will help you get started with the platform.
        </p>
        <h3 className="text-xl font-bold mb-2">What is CBE-AMS?</h3>
        <p className="mb-4">
          CBE-AMS is a secure, decentralized platform for issuing and verifying academic credentials. It leverages blockchain technology to ensure that credentials are tamper-proof and easily verifiable.
        </p>
      </>
    ),
  },
  "api-reference": {
    title: "API Reference",
    content: (
      <>
        <h2 className="text-2xl font-bold mb-4">API Reference</h2>
        <p className="mb-4">
          This section provides a detailed reference for the CBE-AMS API.
        </p>
        <h3 className="text-xl font-bold mb-2">Authentication</h3>
        <p className="mb-4">
          The API uses bearer tokens for authentication. You can obtain a token by logging in to the platform.
        </p>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <code>
            {apiLoginExample}
          </code>
        </pre>
      </>
    ),
  },
  "troubleshooting": {
    title: "Troubleshooting",
    content: (
      <>
        <h2 className="text-2xl font-bold mb-4">Troubleshooting</h2>
        <p className="mb-4">
          This section provides solutions to common problems.
        </p>
        <h3 className="text-xl font-bold mb-2">Cannot log in</h3>
        <p className="mb-4">
          If you are unable to log in, please check your email and password and try again. If you have forgotten your password, you can reset it using the &quot;Forgot password?&quot; link on the login page.
        </p>
      </>
    ),
  },
};

export default function Docs() {
  const [activeSection, setActiveSection] = useState("getting-started");

  return (
    <>
      <Head>
        <title>Docs - CBE-AMS</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
        <OnboardingNav />
        <main className="flex-grow max-w-7xl mx-auto px-6 py-12 w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="md:col-span-1 md:sticky top-24 h-full">
              <nav className="flex flex-col gap-2">
                {Object.keys(sections).map((key) => (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    className={`text-left px-4 py-2 rounded-md text-sm font-medium transition ${activeSection === key
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "hover:bg-gray-100 dark:hover:bg-slate-800"}`}>
                    {sections[key].title}
                  </button>
                ))}
              </nav>
            </aside>
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="md:col-span-3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-8">
              {sections[activeSection].content}
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
}
