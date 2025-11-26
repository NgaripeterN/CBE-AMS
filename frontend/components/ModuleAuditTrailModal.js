import React, { useState, useEffect } from 'react';
import api from '../lib/api';

const ModuleAuditTrailModal = ({ moduleId, onClose }) => {
  const [auditTrail, setAuditTrail] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (moduleId) {
      const fetchAuditTrail = async () => {
        try {
          const response = await api.get(`/admin/modules/${moduleId}/audit`);
          setAuditTrail(response.data);
        } catch (err) {
          setError(err.message || 'Failed to fetch audit trail');
        } finally {
          setIsLoading(false);
        }
      };
      fetchAuditTrail();
    }
  }, [moduleId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-card rounded-lg shadow-xl p-8 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">Module Audit Trail</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">&times;</button>
        </div>
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : auditTrail.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {auditTrail.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{log.action}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{log.who}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No audit trail available for this module.</p>
        )}
      </div>
    </div>
  );
};

export default ModuleAuditTrailModal;
