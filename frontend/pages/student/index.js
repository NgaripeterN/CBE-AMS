import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { FiAward, FiBookOpen, FiClock, FiCalendar, FiExternalLink } from 'react-icons/fi';
import StudentCalendar from '../../components/Student/Dashboard/Calendar';
import Link from 'next/link';
import { format } from 'date-fns';
import useAuth from '../../hooks/useAuth';

const StudentDashboard = () => {
  const { user, loading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');
  const [upcomingAssessments, setUpcomingAssessments] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardRes, upcomingRes] = await Promise.all([
          api.get('/student/dashboard'),
          api.get('/student/assessments/upcoming')
        ]);
        setDashboardData(dashboardRes.data);
        setUpcomingAssessments(upcomingRes.data);

      } catch (err) {
        setError('Failed to fetch dashboard data.');
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <p>Loading user data...</p>;
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  if (!dashboardData) {
    return <p>Loading dashboard data...</p>;
  }

  const { credentialsEarned, activeModulesEnrolled, pendingAssessmentsCount } = dashboardData;

  return (
    <div className="container mx-auto px-4 py-4">
      <h1 className="text-3xl font-bold mb-4 text-foreground">Welcome, {user?.name || 'Student'}!</h1>

      {/* Key Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-card p-4 rounded-xl shadow-lg dark:shadow-dark-lg flex items-center justify-between border border-primary/70">
          <div>
            <p className="text-sm text-muted-foreground">Active Modules</p>
            <p className="text-2xl font-bold text-foreground">{activeModulesEnrolled}</p>
          </div>
          <FiBookOpen className="text-blue-500" size={32} />
        </div>
        <div className="bg-card p-4 rounded-xl shadow-lg dark:shadow-dark-lg flex items-center justify-between border border-primary/70">
          <div>
            <p className="text-sm text-muted-foreground">Pending Assessments</p>
            <p className="text-2xl font-bold text-foreground">{pendingAssessmentsCount}</p>
          </div>
          <FiClock className="text-yellow-500" size={32} />
        </div>
        <div className="bg-card p-4 rounded-xl shadow-lg dark:shadow-dark-lg flex items-center justify-between border border-primary/70">
          <div>
            <p className="text-sm text-muted-foreground">Credentials Earned</p>
            <p className="text-2xl font-bold text-foreground">{credentialsEarned}</p>
          </div>
          <FiAward className="text-green-500" size={32} />
        </div>
      </div>

      {/* Content and Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-3 text-foreground">Your Next Tasks</h2>
          {upcomingAssessments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAssessments.map(assessment => (
                <div key={assessment.assessment_id} className="bg-card p-4 rounded-lg shadow-md border border-border">
                  <Link href={`/student/assessments/${assessment.assessment_id}`} passHref legacyBehavior>
                    <a className="flex justify-between items-center group">
                      <div>
                        <p className="text-base font-semibold text-gray-900 dark:text-primary-foreground group-hover:underline">
                          {assessment.title}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-foreground">
                          {assessment.module ? assessment.module.title : 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <FiCalendar className="mr-1" />
                        <span>By {format(new Date(assessment.deadline), 'MMM dd, p')}</span>
                        <FiExternalLink className="ml-2 text-muted-foreground group-hover:text-primary" />
                      </div>
                    </a>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No undone assessments nearing the deadline.</p>
          )}
        </div>
        
        <div>
          <StudentCalendar />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;