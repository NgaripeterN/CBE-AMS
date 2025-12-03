import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

const MediaModal = ({ isOpen, onClose, mediaUrl }) => {
  if (!isOpen) {
    return null;
  }

  const fileExtension = mediaUrl.split('.').pop().toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
  const isVideo = ['mp4', 'webm', 'ogg'].includes(fileExtension);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-[999] flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card rounded-lg shadow-xl relative max-w-4xl w-full max-h-full overflow-auto p-4"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking on the content
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 bg-muted rounded-full text-foreground hover:bg-muted/80 z-10"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        
        {isImage && (
          <Image src={mediaUrl} alt="Enlarged submission media" className="w-full h-auto object-contain" layout="responsive" width={700} height={500} />
        )}
        {isVideo && (
          <video controls autoPlay className="w-full h-auto object-contain">
            <source src={mediaUrl} />
            Your browser does not support the video tag.
          </video>
        )}
        {!isImage && !isVideo && (
            <div className="text-center p-8">
                <p className="text-lg">This file type cannot be previewed.</p>
                <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-primary hover:underline">
                    Open in new tab
                </a>
            </div>
        )}
      </div>
    </div>
  );
};

export default MediaModal;