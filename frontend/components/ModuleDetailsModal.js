import React, { useState, useEffect } from 'react';
import api from '../lib/api';

const ModuleDetailsModal = ({ moduleId, onClose }) => {
  const [module, setModule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (moduleId) {
      const fetchModuleDetails = async () => {
        try {
          const response = await api.get(`/modules/${moduleId}`);
          setModule(response.data);
        } catch (err) {
          setError(err.message || 'Failed to fetch module details');
        } finally {
          setIsLoading(false);
        }
      };
      fetchModuleDetails();
    }
  }, [moduleId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-card rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">Module Details</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">&times;</button>
        </div>
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : module ? (
          <div>
            <div className="mb-4">
              <h3 className="font-semibold text-lg">{module.title}</h3>
              <p className="text-sm text-muted-foreground">{module.moduleCode}</p>
            </div>
            <p className="mb-4">{module.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold">Course</p>
                <p>{module.course.name}</p>
              </div>
              <div>
                <p className="font-semibold">Status</p>
                <p>{module.status}</p>
              </div>
              <div>
                <p className="font-semibold">Version</p>
                <p>{module.version}</p>
              </div>
              <div>
                <p className="font-semibold">Created By</p>
                <p>{module.createdBy}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ModuleDetailsModal;
