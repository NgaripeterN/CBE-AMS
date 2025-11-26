import Link from "next/link";
import ThemeSwitcher from "../ThemeSwitcher";

export default function OnboardingNav() {
  return (
    <header className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border-b border-gray-100 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-slate-800 dark:text-white">
            CBE-AMS Platform
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/" className="text-sm px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition">Home</Link>
            <Link href="/docs" className="text-sm px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition">Docs</Link>
            <Link href="/support" className="text-sm px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition">Support</Link>
            <Link href="/verify" className="text-sm px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition">Verify Credential</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700 transition">Login</Link>
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
