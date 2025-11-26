import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const TermsOfUseModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Terms of Use</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <h3 className="font-semibold text-gray-700">1. Acceptance of Terms</h3>
          <p className="mt-1 mb-4 text-sm text-gray-600">
            By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
          </p>

          <h3 className="font-semibold text-gray-700">2. User Conduct and Responsibilities</h3>
          <p className="mt-1 mb-4 text-sm text-gray-600">
            You are responsible for all activities that occur under your account. You agree to notify the administration immediately of any unauthorized use of your account or any other breach of security. You agree not to submit any content that is unlawful, harmful, threatening, abusive, or otherwise objectionable. All academic submissions must be your own original work.
          </p>

          <h3 className="font-semibold text-gray-700">3. Credential Issuance</h3>
          <p className="mt-1 mb-4 text-sm text-gray-600">
            Credentials issued by this platform are a representation of demonstrated competency based on the evidence provided through assessments and observations. The integrity of your credentials depends on the integrity of your academic work. Any violation of academic honesty policies may result in the revocation of issued credentials.
          </p>

          <h3 className="font-semibold text-gray-700">4. Data Privacy</h3>
          <p className="mt-1 mb-4 text-sm text-gray-600">
            We are committed to protecting your privacy. Your personal information, including your name, registration number, and program, will be used for the purpose of academic administration and credential issuance. Your assessment submissions and grades are part of your academic record. Anonymized and aggregated data may be used for institutional research and quality improvement purposes.
          </p>
          
          <h3 className="font-semibold text-gray-700">5. Disclaimer of Warranties</h3>
          <p className="mt-1 mb-4 text-sm text-gray-600">
            The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. The institution makes no warranty that the service will meet your requirements, be uninterrupted, timely, secure, or error-free.
          </p>
        </div>
        <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUseModal;
