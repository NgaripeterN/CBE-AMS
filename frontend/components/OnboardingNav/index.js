import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import ThemeSwitcher from "../ThemeSwitcher";

export default function OnboardingNav() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Docs", href: "/docs" },
    { name: "Support", href: "/support" },
    { name: "Verify Credential", href: "/verify" },
  ];

  return (
    <header className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border-b border-gray-100 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-slate-800 dark:text-white">
            CBE-AMS Platform
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700 transition">
              Login
            </Link>
            <ThemeSwitcher />
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeSwitcher />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-base font-medium px-3 py-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 pb-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-base font-medium px-3 py-3 rounded-md bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition"
                >
                  Login
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
