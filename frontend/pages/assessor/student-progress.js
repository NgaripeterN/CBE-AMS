import React, { useState, useEffect } from 'react';
import { getStudentProgressData, getAssessorModules } from '../../lib/api';
import { UserIcon } from '@heroicons/react/24/outline';

const StudentProgress = () => {
  const [data, setData] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const modulesData = await getAssessorModules();
        setModules(modulesData.modules);
      } catch (err) {
        console.error("Failed to fetch modules", err);
      }
    };
    fetchModules();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getStudentProgressData(page, selectedModule);
        setData(result.data);
        setTotalPages(result.totalPages);
        setError(null);
      } catch (err) {
        setError(err.message || 'An error occurred while fetching data.');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, selectedModule]);

  const filteredData = data.filter((item) =>
    item.student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>
      
    );
  }

  if (error) {
    return <p className="text-destructive-foreground text-center">{error}</p>;
  }

  return (
    
      <div className="max-w-7xl mx-auto">
        <div className="bg-card rounded-xl shadow-lg p-8">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <h1 className="text-4xl font-extrabold text-foreground">Student Progress</h1>
            <select
              className="w-full md:w-auto px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
            >
              <option value="">All Modules</option>
              {modules.map((module) => (
                <option key={module.module_id} value={module.module_id}>
                  {module.title}
                </option>
              ))}
            </select>
          </div>
          <p className="text-lg text-muted-foreground mb-6">Track student submissions and observations.</p>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by student name..."
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredData.map((item) => (
              <div key={item.student.user_id} className="bg-card rounded-xl shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ease-in-out border border-border">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-primary text-primary-foreground rounded-full p-3">
                      <UserIcon className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-xl font-bold text-foreground">{item.student.name}</h2>
                      <p className="text-sm text-muted-foreground">{item.student.email}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Submissions</h3>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <p>Total: {item.submissions.length}</p>
                      <p>Graded: {item.submissions.filter(s => s.gradedAt).length}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Recent Observations</h3>
                    {item.observations.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {item.observations.slice(0, 3).map((obs) => (
                          <li key={obs.id} className="text-sm">{obs.notes} ({obs.descriptor})</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No observations yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No students found.</p>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Previous
              </button>
              <span className="relative inline-flex items-center px-4 py-2 border border-border bg-card text-sm font-medium text-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    
  );
};

export default StudentProgress;