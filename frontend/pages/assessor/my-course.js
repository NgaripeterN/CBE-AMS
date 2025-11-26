import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { getLeadCourse } from '../../lib/api';
import { useRouter } from 'next/router';
import AssessorLayout from '../../components/AssessorLayout';
import { BookOpenIcon } from '@heroicons/react/24/outline';

const MyCoursePage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      const fetchCourse = async () => {
        try {
          setLoading(true);
          const courseData = await getLeadCourse();
          setCourse(courseData);
          setError(null);
        } catch (err) {
          if (err.response && err.response.data && err.response.data.error) {
            setError(err.response.data.error);
          } else {
            setError('An error occurred while fetching the course.');
          }
          setCourse(null);
        } finally {
          setLoading(false);
        }
      };
      fetchCourse();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p className="text-destructive-foreground">Error: {error}</p>;
  }

  if (!course) {
    return <p>You are not assigned as a lead to any course.</p>;
  }

  return (
    
      <div className="flex items-center justify-center min-h-full">
          <div className="max-w-4xl w-full">
              <div className="bg-card rounded-lg shadow-lg dark:shadow-dark-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out border border-primary/70">
                  <div className="flex">
                      <div className="w-1/3 bg-card p-8 flex flex-col justify-center items-center">
                          <span className="bg-muted text-muted-foreground text-sm font-semibold mb-4 px-3 py-1 rounded-full">
                              Course Lead
                          </span>
                          <Link href={`/assessor/course-management/${course.course_id}`} legacyBehavior>
                              <a className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:-translate-y-1">
                                  Manage Course
                              </a>
                          </Link>
                      </div>
                      <div className="w-2/3 bg-gradient-to-r from-primary to-primary/80 p-8">
                          <h1 className="text-3xl font-bold text-primary-foreground mb-2">{course.name}</h1>
                          <p className="text-lg text-primary-foreground/80 mb-4">{course.code}</p>
                          <p className="text-primary-foreground">{course.description}</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    
  );
};

export default MyCoursePage;