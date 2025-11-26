import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import OnboardingNav from "../components/OnboardingNav";

const faqs = [
  {
    question: "How do I reset my password?",
    answer: "You can reset your password by clicking the 'Forgot password?' link on the login page.",
  },
  {
    question: "How do I verify a credential?",
    answer: "You can verify a credential by clicking the 'Verify Credential' link on the home page and uploading the credential's JSON file.",
  },
  {
    question: "How do I contact support?",
    answer: "You can contact support by filling out the contact form on this page.",
  },
];

export default function Support() {
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <>
      <Head>
        <title>Support - CBE-AMS</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
        <OnboardingNav />
        <main className="flex-grow max-w-7xl mx-auto px-6 py-12 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-8">
              <h2 className="text-2xl font-bold mb-4">Contact Support</h2>
              {formSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}>
                  <p className="text-green-600 dark:text-green-400">Thank you for your message. We will get back to you shortly.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input type="text" id="name" name="name" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input type="email" id="email" name="email" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                    <textarea id="message" name="message" rows="4" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                  </div>
                  <button type="submit" className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md text-white font-medium bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Submit</button>
                </form>
              )}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-8">
              <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <details key={index} className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
                    <summary className="font-medium cursor-pointer">{faq.question}</summary>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
