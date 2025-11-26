import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import 'react-calendar/dist/Calendar.css';
import '../styles/globals.css';

function MyApp({ Component, pageProps, router }) {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class">
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <AppContent Component={Component} pageProps={pageProps} router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}

function AppContent({ Component, pageProps, router }) {
  const { loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (router.pathname === '/login' || router.pathname === '/verify' || router.pathname === '/forgot-password' || router.pathname === '/verify-otp') {
    return <Component {...pageProps} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
