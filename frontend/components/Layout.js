import { useRouter } from 'next/router';
import AdminLayout from './AdminLayout';
import AssessorLayout from './AssessorLayout';
import StudentLayout from './StudentLayout';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (router.pathname.startsWith('/admin')) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  if (router.pathname.startsWith('/assessor')) {
    return <AssessorLayout>{children}</AssessorLayout>;
  }

  if (router.pathname.startsWith('/student')) {
    return <StudentLayout>{children}</StudentLayout>;
  }

  return <>{children}</>;
};

export default Layout;
