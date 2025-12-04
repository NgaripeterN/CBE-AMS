import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import CredentialDetailsModal from './CredentialDetailsModal';
import ShareCredentialModal from './ShareCredentialModal';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { FiShare2, FiEye, FiCheckCircle, FiFileText, FiExternalLink } from 'react-icons/fi';

const CredentialCard = ({ credential, onUpdate, isCourse = false }) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const router = useRouter();

  const handleOpenDetailsModal = () => setIsDetailsModalOpen(true);
  const handleCloseDetailsModal = () => setIsDetailsModalOpen(false);
  const handleOpenShareModal = () => setIsShareModalOpen(true);
  const handleCloseShareModal = () => setIsShareModalOpen(false);

  const handleDownloadJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(credential.payloadJson, null, 2)
    )}`;
    const fileName = (credential.payloadJson?.badge?.name || credential.payloadJson?.credentialSubject?.moduleTitle || credential.payloadJson?.credentialSubject?.courseTitle || 'credential').replace(/\s+/g, '_');
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `${fileName}_credential.json`;
    link.click();
  };

  const handleVerify = () => {
    window.open(`/verify?credentialId=${credential.id}`, '_blank');
  };

  const title = credential.payloadJson?.badge?.name || credential.payloadJson?.credentialSubject?.moduleTitle || credential.payloadJson?.credentialSubject?.courseTitle || 'Credential';
  const description = credential.payloadJson?.badge?.description || credential.module?.description || credential.course?.description || 'No description.';
  const credentialType = isCourse ? 'Course Credential' : 'Micro-Credential';

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <>
      <motion.div
        variants={cardVariants}
        className="bg-card text-card-foreground rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 border-border"
      >
        <div className={`p-6 bg-gradient-to-br ${isCourse ? 'from-primary/20 to-card' : 'from-secondary/20 to-card'}`}>
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${isCourse ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-muted-foreground'}`}>
              {credentialType}
            </span>
          </div>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>

        <div className="p-6">
          {credential.txHash && (
            <div className="mb-6 border-b border-border pb-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <FiCheckCircle className="text-green-500 mr-2" />
                <span>Status:</span>
                <span className="font-semibold text-green-500 ml-1">{credential.verificationStatus || 'Issued'}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <FiExternalLink className="mr-2" />
                <span>Transaction:</span>
                <a href={`https://sepolia.etherscan.io/tx/${credential.txHash}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1 truncate">
                  {credential.txHash}
                </a>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm">
            <ActionButton icon={<FiEye />} text="Details" onClick={handleOpenDetailsModal} />
            <ActionButton icon={<FiShare2 />} text="Share" onClick={handleOpenShareModal} />
            <ActionButton icon={<FiFileText />} text="JSON" onClick={handleDownloadJson} />
            <ActionButton icon={<FiCheckCircle />} text="Verify" onClick={handleVerify} />
          </div>
        </div>
      </motion.div>

      {isDetailsModalOpen && <CredentialDetailsModal credential={credential} onClose={handleCloseDetailsModal} />}
      {isShareModalOpen && <ShareCredentialModal credential={credential} onClose={handleCloseShareModal} />}
    </>
  );
};

const ActionButton = ({ icon, text, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center space-y-1 text-muted-foreground hover:text-primary transition-colors duration-200 ${className}`}
  >
    <div className="text-2xl">{icon}</div>
    <span className="font-medium">{text}</span>
  </button>
);

export default CredentialCard;
