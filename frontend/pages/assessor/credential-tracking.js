import React, { useState, useEffect } from 'react';
import { getCredentialTrackingData } from '../../lib/api';

const CredentialTracking = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getCredentialTrackingData();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message || 'An error occurred while fetching data.');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
          <h1 className="text-4xl font-extrabold text-foreground mb-4">Credential Tracking</h1>
          <p className="text-lg text-muted-foreground mb-8">Track student credential progress.</p>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by student name..."
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-card">
              <thead className="bg-muted text-foreground">
                <tr>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Student Name</th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Email</th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Micro-Credentials</th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Course Credentials</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {filteredData.map((item) => (
                  <tr key={item.student.user_id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">{item.student.name}</td>
                    <td className="py-3 px-4">{item.student.email}</td>
                    <td className="py-3 px-4">
                      {item.microCredentials.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {item.microCredentials.map((cred) => (
                            <li key={cred.id}>{cred.module.title} - {cred.descriptor}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.courseCredentials.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {item.courseCredentials.map((cred) => (
                            <li key={cred.id}>{cred.course.name} - {cred.descriptor}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No students found.</p>
            </div>
          )}
        </div>
      </div>
    
  );
};

export default CredentialTracking;