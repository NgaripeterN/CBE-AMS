import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { DocumentChartBarIcon, CheckBadgeIcon, RectangleStackIcon } from '@heroicons/react/24/outline';

const AssessorDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const metricsRes = await api.get('/assessor/dashboard/metrics');
        setMetrics(metricsRes.data);

        const activityRes = await api.get('/assessor/dashboard/recent-activity');
        setRecentActivity(activityRes.data);

        if (user?.role === 'LEAD') {
          const courseRes = await api.get('/lead/my-course');
          setCourse(courseRes.data);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (isLoading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div></div>;
  if (error) return <p className="text-center mt-8 text-destructive-foreground">Error: {error}</p>;

  const metricCards = metrics ? [
    { name: 'Submissions to Grade', stat: metrics.submissionsToGrade, icon: DocumentChartBarIcon, color: 'bg-yellow-500' },
    { name: 'Graded (Last 30d)', stat: metrics.submissionsGradedLast30Days, icon: CheckBadgeIcon, color: 'bg-blue-500' },
    { name: 'Active Modules', stat: metrics.activeModules, icon: RectangleStackIcon, color: 'bg-green-500' },
  ] : [];

  return (
    
      <div className="container mx-auto p-4">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-foreground">Welcome, {user?.name || 'Assessor'}</h1>
          <p className="mt-2 text-xl text-muted-foreground">Here’s your dashboard at a glance.</p>
        </header>

        {/* Key Metrics */}
        {metrics && (
          <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {metricCards.map((item) => (
              <div key={item.name} className="relative bg-card pt-5 px-4 pb-5 sm:pt-6 sm:px-6 shadow-lg dark:shadow-dark-lg rounded-lg overflow-hidden border border-primary/70">
                <dt>
                  <div className={`absolute ${item.color} rounded-md p-3`}>
                    <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-sm font-medium text-muted-foreground truncate">{item.name}</p>
                </dt>
                <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                  <p className="text-2xl font-semibold text-foreground">{item.stat}</p>
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Links & My Course */}
          <div className="space-y-8">
            {user?.role === 'LEAD' && course && (
              <div className="bg-card rounded-lg shadow-lg dark:shadow-dark-lg p-6 border border-primary/70 overflow-hidden">
                <h3 className="text-2xl font-bold text-foreground mb-4">My Course</h3>
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="text-xl font-semibold text-foreground">{course.name}</h4>
                  <p className="text-muted-foreground mt-1">{course.code}</p>
                  <div className="flex flex-col gap-2 mt-4">
                    <Link href={`/assessor/course-management/${course.course_id}`} className="w-full text-center bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-4 rounded-lg transition-all duration-300 shadow-sm">
                        Manage Course
                    </Link>
                    <Link href={`/assessor/course-management/performance?courseId=${course.course_id}`} className="w-full text-center bg-background hover:bg-muted text-foreground font-bold py-2.5 px-4 rounded-lg transition-all duration-300 border-2 border-primary/30 hover:border-primary shadow-sm flex items-center justify-center gap-2">
                        <DocumentChartBarIcon className="h-4 w-4 text-primary" />
                        Performance Analytics
                    </Link>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-card rounded-lg shadow-lg dark:shadow-dark-lg p-6 border border-primary/70 overflow-hidden">
              <h3 className="text-2xl font-bold text-foreground mb-4">Quick Links</h3>
              <div className="space-y-4">
                <Link href="/assessor/announcements" legacyBehavior>
                  <a className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-lg transition-colors duration-300 text-center block">View Announcements</a>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-card rounded-xl shadow-lg p-6 border border-primary/70">
            <h3 className="text-2xl font-bold text-foreground mb-6">Recent Activity</h3>
            {recentActivity.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentActivity.map(activity => (
                  <li key={activity.id} className="py-4 flex items-center">
                    <div className="bg-muted rounded-full h-10 w-10 flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div className="flex-1">
                      {activity.type === 'submission' ? (
                        <p className="text-lg text-foreground"><span className="font-semibold">{activity.student}</span> submitted <span className="font-semibold text-primary">{activity.assessment}</span>.</p>
                      ) : (
                        <p className="text-lg text-foreground"><span className="font-semibold">Announcement:</span> {activity.title}</p>
                      )}
                      <p className="text-md text-muted-foreground mt-1">{new Date(activity.time).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-lg text-muted-foreground">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    
  );
};

export default AssessorDashboard;