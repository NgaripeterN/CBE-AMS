import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Header from '@/components/Header';
import { useTheme } from 'next-themes';
import {
  HomeIcon,
  BookOpenIcon,
  UserGroupIcon,
  RectangleStackIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  DocumentPlusIcon,
  ArrowLeftIcon,
  KeyIcon,
  AcademicCapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const AssessorLayout = ({ children }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const isLead = user && user.leadForCourseId;
  const [courseId, setCourseId] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false); // for desktop

  useEffect(() => {
    const { id, courseId: queryCourseId, course_id: queryCourse_id } = router.query;
    if (id) {
      setCourseId(id);
    } else if (queryCourseId) {
      setCourseId(queryCourseId);
    } else if (queryCourse_id) {
      setCourseId(queryCourse_id);
    } else if (isLead) {
      setCourseId(user.leadForCourseId);
    }
  }, [router.query, isLead, user]);

  const isCourseManagementPage = 
    router.pathname.startsWith('/assessor/course-management') ||
    router.pathname.startsWith('/assessor/credential-management') ||
    router.pathname === '/assessor/create-module' ||
    router.pathname.startsWith('/assessor/edit-module') ||
    router.pathname === '/assessor/import-modules';

  let navItems = [];

  if (isLead) {
    if (isCourseManagementPage && courseId) {
      navItems = [
        { href: '/assessor/my-course', label: 'Back to My Course', icon: ArrowLeftIcon },
        { href: `/assessor/course-management/${courseId}`, label: 'Overview', icon: HomeIcon },
        { href: `/assessor/create-module?course_id=${courseId}`, label: 'Create Module', icon: DocumentPlusIcon },
      ];
    } else {
      navItems = [
        { href: '/assessor', label: 'Home', icon: HomeIcon },
        { href: '/assessor/my-course', label: 'My Course', icon: BookOpenIcon },
        { href: '/assessor/my-modules', label: 'My Modules', icon: RectangleStackIcon },
        { href: '/assessor/credential-tracking', label: 'Credential Tracking', icon: AcademicCapIcon }
      ];
    }
  } else {
    // Regular Assessor nav items
    navItems = [
      { href: '/assessor', label: 'Home', icon: HomeIcon },
      { href: '/assessor/my-modules', label: 'My Modules', icon: RectangleStackIcon },
    ];
  }

  const bottomNavItems = [
    { href: '/change-password', label: 'Change Password', icon: KeyIcon },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-border h-20 flex items-center justify-between">
        {!isSidebarCollapsed && <h1 className="text-2xl font-bold text-foreground">{isLead ? 'Lead Assessor' : 'Assessor'}</h1>}
        <button
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="p-2 rounded-md text-muted-foreground hover:bg-muted hidden md:block"
          aria-label="Toggle Sidebar"
        >
          {isSidebarCollapsed ? (
            <ChevronRightIcon className="h-6 w-6" />
          ) : (
            <ChevronLeftIcon className="h-6 w-6" />
          )}
        </button>
      </div>
      <nav className="px-2 py-4 overflow-y-auto flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === '/assessor' ? router.pathname === item.href : router.pathname.startsWith(item.href.split('?')[0]);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link href={item.href} legacyBehavior>
                  <a
                    className={`flex items-center px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/50'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={`h-5 w-5 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
                    {!isSidebarCollapsed && item.label}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-border">
        <ul className="space-y-1">
          {bottomNavItems.map((item) => {
              const isActive = router.pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link href={item.href} legacyBehavior>
                    <a
                      className={`flex items-center px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/50'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className={`h-5 w-5 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
                      {!isSidebarCollapsed && item.label}
                    </a>
                  </Link>
                </li>
              );
            })}
        </ul>
        <div className='pt-2'>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold py-2 px-4 rounded mt-4"
            type="button"
          >
            <ArrowLeftOnRectangleIcon className={`h-5 w-5 ${!isSidebarCollapsed ? 'mr-2' : ''}`} />
            {!isSidebarCollapsed && "Logout"}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-40 flex md:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out`}
      >
        <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)}></div>
        <aside className="relative z-10 w-64 bg-card shadow-md flex flex-col border-r border-border">
          <SidebarContent />
        </aside>
      </div>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex md:flex-col bg-card shadow-md border-r border-border transition-all duration-300 ease-in-out sticky top-0 h-screen ${
        isSidebarCollapsed ? 'md:w-20' : 'md:w-64'
      }`}>
        <SidebarContent />
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col">
        <Header />
        <div className="md:hidden flex justify-between items-center p-4 bg-card border-b border-border">
          <h1 className="text-xl font-bold text-foreground">{isLead ? 'Lead Assessor' : 'Assessor'}</h1>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md text-muted-foreground hover:bg-muted">
            {isSidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
        <div className={`p-4 md:p-8 flex-1 ${theme === 'light' ? 'bg-gray-200' : ''}`}>
          <div className="bg-card rounded-lg shadow-lg dark:shadow-dark-lg p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssessorLayout;