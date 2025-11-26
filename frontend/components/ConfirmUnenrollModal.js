import React from 'react';

const ConfirmUnenrollModal = ({ studentName, onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-card rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-foreground mb-4">Confirm Unenrollment</h2>
        <p className="text-muted-foreground mb-6">
          Are you sure you want to unenroll {studentName}? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-muted text-muted-foreground hover:bg-muted/80">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/80">
            Unenroll
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmUnenrollModal;
