import React, { useState, useEffect } from 'react';
import { UsersIcon, BookOpenIcon, UserGroupIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';

const AdminDashboard = () => {
  const [stats, setStats] = useState([
    { name: 'Total Students', stat: '0', icon: UsersIcon, bgColor: 'bg-blue-500' },
    { name: 'Total Courses', stat: '0', icon: BookOpenIcon, bgColor: 'bg-green-500' },
    { name: 'Total Assessors', stat: '0', icon: UserGroupIcon, bgColor: 'bg-yellow-500' },
  ]);
  const [extendedStats, setExtendedStats] = useState([
    { name: 'Active Students', stat: '0', icon: UserGroupIcon, bgColor: 'bg-cyan-500' },
    { name: 'Credentials Issued', stat: '0', icon: CheckBadgeIcon, bgColor: 'bg-rose-500' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await api.get('/admin/dashboard-stats');
        setStats([
          { name: 'Total Students', stat: data.studentCount.toString(), icon: UsersIcon, bgColor: 'bg-blue-500' },
          { name: 'Total Courses', stat: data.courseCount.toString(), icon: BookOpenIcon, bgColor: 'bg-green-500' },
          { name: 'Total Assessors', stat: data.assessorCount.toString(), icon: UserGroupIcon, bgColor: 'bg-yellow-500' },
        ]);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchExtendedData = async () => {
      try {
        const { data } = await api.get('/admin/dashboard-extended-stats');
        setExtendedStats([
          { name: 'Active Students', stat: data.activeStudentsCount.toString(), icon: UserGroupIcon, bgColor: 'bg-cyan-500' },
          { name: 'Credentials Issued', stat: data.credentialsIssuedCount.toString(), icon: CheckBadgeIcon, bgColor: 'bg-rose-500' },
        ]);
      } catch (error) {
        console.error("Failed to fetch extended dashboard data", error);
      }
    };

    fetchDashboardData();
    fetchExtendedData();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2 text-foreground">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-6">Welcome back, Admin! Here&#39;s an overview of the system.</p>

      <div>
        <h3 className="text-lg leading-6 font-medium text-foreground">Key Metrics</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((item) => (
              <div key={item.name} className="relative bg-card pt-5 px-4 pb-5 sm:pt-6 sm:px-6 shadow-lg dark:shadow-dark-lg rounded-lg overflow-hidden border border-primary/70">
                <dt>
                  <div className={`absolute ${item.bgColor} rounded-md p-3`}>
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
      </div>

      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-foreground">Additional Metrics</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {extendedStats.map((item) => (
              <div key={item.name} className="relative bg-card pt-5 px-4 pb-5 sm:pt-6 sm:px-6 shadow-lg dark:shadow-dark-lg rounded-lg overflow-hidden border border-primary/70">
                <dt>
                  <div className={`absolute ${item.bgColor} rounded-md p-3`}>
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
      </div>
    </div>
  );
};

export default AdminDashboard;