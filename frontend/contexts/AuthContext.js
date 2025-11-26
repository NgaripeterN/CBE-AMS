import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';
import useAuthHook from '../hooks/useAuth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { user, loading, logout: authLogout } = useAuthHook();
  const [localUser, setLocalUser] = useState(user);
  const [localLoading, setLocalLoading] = useState(loading);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/auth/me'); // Assuming you have a /auth/me endpoint
      localStorage.setItem('user', JSON.stringify(data));
      setLocalUser(data); // This sets the user with full details including assessor
      return data;
    } catch (error) {
      // This might fail if the token is invalid, so log out
      logout();
      return null; // Return null on error
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser().finally(() => {
        setLocalLoading(false);
      });
    } else {
      setLocalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (localLoading) {
      return;
    }

    if (localUser) {
      if (localUser.mustChangePassword) {
        if (router.pathname !== '/change-password') {
          router.push('/change-password');
        }
      } else if (localUser.role === 'STUDENT' && !localUser.onboardingCompleted) {
        if (router.pathname !== '/student/onboarding') {
          router.push('/student/onboarding');
        }
      } else {
        // Redirect to dashboard if on a public page like login
        if (router.pathname === '/login' || router.pathname === '/' || router.pathname === '/verify-otp') {
           switch (localUser.role) {
              case 'ADMIN':
                router.push('/admin');
                break;
              case 'LEAD': // Add this case
              case 'ASSESSOR':
                router.push('/assessor');
                break;
              case 'STUDENT':
                router.push('/student');
                break;
              default:
                router.push('/login');
           }
        }
      }
    } else {
      // If no user, redirect to login page, unless they are already there or on a public page
      const publicPages = ['/login', '/', '/verify', '/docs', '/support', '/about', '/forgot-password', '/verify-otp'];
      if (!publicPages.includes(router.pathname)) {
        router.push('/login');
      }
    }
  }, [localUser, localLoading, router]);

  const login = async (email, password) => {
    try {
      await api.post('/auth/login', { email, password });
      router.push(`/verify-otp?email=${email}`);
    } catch (error) {
      console.error('AuthProvider: Login failed:', error);
      throw error;
    }
  };

  const verifyOtp = async (email, otp) => {
    setLocalLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      localStorage.setItem('token', data.token);
      const fullUser = await fetchUser(); // Fetch full user details after token is set
      return fullUser;
    } catch (error) {
      console.error('AuthProvider: OTP verification failed:', error);
      throw error.response.data;
    } finally {
      setLocalLoading(false);
    }
  };

  const resendOtp = async (email) => {
    try {
      await api.post('/auth/resend-otp', { email });
    } catch (error) {
      console.error('AuthProvider: Resend OTP failed:', error);
      throw error;
    }
  };

  const logout = () => {
    authLogout();
    setLocalUser(null);
  };

  const changePassword = async (passwords) => {
    try {
      await api.post('/auth/change-password', passwords);
      logout();
    } catch (error) {
      console.error('AuthProvider: changePassword failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user: localUser, login, logout, loading: localLoading, fetchUser, changePassword, verifyOtp, resendOtp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);