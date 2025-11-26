import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { FiLock, FiUsers, FiLink, FiAward, FiCheckCircle, FiArrowRight } from 'react-icons/fi';

const About = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  const principles = [
    { icon: <FiLock />, title: "Decentralization & Security", description: "Leveraging blockchain to ensure credentials are tamper-proof and resistant to single points of failure." },
    { icon: <FiUsers />, title: "Learner-Centric Ownership", description: "Empowering learners with full control and ownership of their digital academic achievements." },
    { icon: <FiLink />, title: "Verifiable & Interoperable", description: "Creating a universal standard for credentials that can be instantly verified by anyone, anywhere." },
  ];

  const processSteps = [
    { icon: <FiAward />, text: "Student completes a course or module." },
    { icon: <FiCheckCircle />, text: "Assessor grades and verifies the achievement." },
    { icon: <FiLock />, text: "A secure, verifiable credential is issued on-chain." },
    { icon: <FiUsers />, text: "Learner shares their credential with employers or other institutions." },
  ];

  return (
    <>
      <Head>
        <title>About Us - CBE-AMS</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-lg font-semibold text-slate-800 dark:text-white">CBE-AMS Platform</Link>
              <nav className="hidden md:flex items-center gap-2">
                <Link href="/" className="text-sm px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition">Home</Link>
                <Link href="/docs" className="text-sm px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition">Docs</Link>
                <Link href="/support" className="text-sm px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition">Support</Link>
                <Link href="/verify" className="text-sm px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition">Verify Credential</Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700 transition">Login</Link>
              <ThemeSwitcher />
            </div>
          </div>
        </header>

        <main className="flex-grow w-full">
          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center py-20 md:py-28 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800"
          >
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              <span className="block">The Future of</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Verified Achievement</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              CBE-AMS is a collaborative open-source project dedicated to building a new, equitable infrastructure for academic and professional credentialing.
            </p>
          </motion.section>

          {/* Principles Section */}
          <section className="py-20 md:py-24">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Our Core Principles</h2>
                <p className="mt-2 text-md text-slate-500 dark:text-slate-400">The values that drive our development.</p>
              </div>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {principles.map((p, i) => (
                  <motion.div key={i} variants={itemVariants} className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-slate-700">
                    <div className="text-4xl text-indigo-500 mb-4">{p.icon}</div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{p.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400">{p.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* How it Works Section */}
          <section className="py-20 md:py-24 bg-white dark:bg-slate-800">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">How It Works</h2>
                <p className="mt-2 text-md text-slate-500 dark:text-slate-400">A simplified, transparent, and secure process.</p>
              </div>
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="relative flex flex-col md:flex-row justify-between items-center gap-8"
              >
                {processSteps.map((step, i) => (
                  <>
                    <motion.div key={i} variants={itemVariants} className="flex flex-col items-center text-center w-full md:w-1/4">
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 text-3xl mb-4">
                        {step.icon}
                      </div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{step.text}</p>
                    </motion.div>
                    {i < processSteps.length - 1 && (
                      <motion.div variants={itemVariants} className="hidden md:block text-3xl text-slate-300 dark:text-slate-600">
                        <FiArrowRight />
                      </motion.div>
                    )}
                  </>
                ))}
              </motion.div>
            </div>
          </section>
        </main>

        <footer className="py-6 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} CBE-AMS. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
};

export default About;