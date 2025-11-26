import React from 'react';

const ErrorModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Error</h2>
        <p className="text-gray-600 dark:text-gray-300">{message}</p>
        <div className="mt-6 text-right">
          <button onClick={onClose} className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;