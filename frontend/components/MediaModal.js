import React, { useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

const MediaModal = ({ src, fileType, alt, isOpen, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderMedia = () => {
    if (fileType.startsWith('image/')) {
      return (
        <div className="relative w-[90vw] h-[90vh]">
          <Image src={src} alt={alt} layout="fill" objectFit="contain" />
        </div>
      );
    }
    if (fileType.startsWith('video/')) {
      return (
        <video controls src={src} className="w-auto h-auto" style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
          Your browser does not support the video tag.
        </video>
      );
    }
    if (fileType === 'application/pdf') {
      return <iframe src={src} className="w-[90vw] h-[90vh]" title={alt}></iframe>;
    }
    return <p className="text-white">Unsupported file type or unable to display.</p>;
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Close when clicking outside the media
    >
      <div 
        ref={modalRef}
        className="relative bg-zinc-800 p-4 rounded-lg shadow-lg flex items-center justify-center"
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white hover:text-gray-300 bg-gray-700 rounded-full p-1 z-10"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        {renderMedia()}
      </div>
    </div>
  );
};

export default MediaModal;
