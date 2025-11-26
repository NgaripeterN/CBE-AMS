import React, { useState, useEffect } from 'react';
import api from '../lib/api';

const ModuleAssignmentsModal = ({ moduleId, onClose }) => {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (moduleId) {
      const fetchAssignments = async () => {
        try {
          const response = await api.get(`/modules/${moduleId}/assessors`);
          setAssignments(response.data);
        } catch (err) {
          setError(err.message || 'Failed to fetch assignments');
        } finally {
          setIsLoading(false);
        }
      };
      fetchAssignments();
    }
  }, [moduleId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-card rounded-lg shadow-xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">Module Assignments</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">&times;</button>
        </div>
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : assignments.length > 0 ? (
          <ul className="divide-y divide-border">
            {assignments.map((assessor) => (
              <li key={assessor.id} className="py-3">
                <p className="font-semibold text-foreground">{assessor.user.name}</p>
                <p className="text-sm text-muted-foreground">{assessor.user.email}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No assessors assigned to this module.</p>
        )}
      </div>
    </div>
  );
};

export default ModuleAssignmentsModal;
