import React from 'react';

const CompetencyWarningModal = ({ isOpen, onConfirm, onClose, errors }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-card rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-foreground mb-4">Competency Warning</h2>
        <p className="text-muted-foreground mb-6">
          The following questions have scores but no linked competencies selected. Are you sure you want to proceed?
        </p>
        <ul className="list-disc list-inside mb-6 space-y-2 text-destructive">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-muted text-muted-foreground hover:bg-muted/80">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/80">
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompetencyWarningModal;
