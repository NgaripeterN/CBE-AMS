import React from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const CredentialRequirementsModal = ({
  isOpen,
  onClose,
  onConfirm,
  addedModules,
  removedModules,
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Confirm Changes to Credential Requirements</h2>

          <div className="space-y-4">
            {addedModules.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-green-600 dark:text-green-400">Modules to be ADDED:</h3>
                <ul className="list-disc list-inside pl-2 mt-1 text-gray-700 dark:text-gray-300">
                  {addedModules.map(m => <li key={m.module_id}>{m.title}</li>)}
                </ul>
              </div>
            )}
            {removedModules.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-red-600 dark:text-red-400">Modules to be REMOVED:</h3>
                <ul className="list-disc list-inside pl-2 mt-1 text-gray-700 dark:text-gray-300">
                  {removedModules.map(m => <li key={m.module_id}>{m.title}</li>)}
                </ul>
              </div>
            )}
            {addedModules.length === 0 && removedModules.length === 0 && (
                <p className="text-gray-700 dark:text-gray-300">No changes have been made to the credential requirements.</p>
            )}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  Changing these requirements will not affect credentials that have already been issued. However, it will apply to all students currently in progress. Please ensure all affected students are notified of these changes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={addedModules.length === 0 && removedModules.length === 0}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Confirm and Save
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CredentialRequirementsModal;
