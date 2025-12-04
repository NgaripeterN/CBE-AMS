import React from 'react';

const CredentialDetailsModal = ({ credential, onClose }) => {
  if (!credential) {
    return null;
  }

  // Safely parse the payload if it's a string
  const payload = typeof credential.payloadJson === 'string' 
    ? JSON.parse(credential.payloadJson) 
    : credential.payloadJson;

  const recipientName = credential.student?.user?.name || payload.credentialSubject?.name || 'N/A';
  const recipientEmail = credential.student?.user?.email || 'N/A';
  const recipientRegNumber = credential.student?.user?.regNumber || payload.recipient?.saltedHashedStudentId || 'N/A';

  let description = payload.badge?.description;
  if (!description) {
    if (credential.module?.description) description = credential.module.description;
    else if (credential.course?.description) description = credential.course.description;
    else description = payload.credentialSubject?.moduleTitle || payload.credentialSubject?.courseTitle || 'No description available.';
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-card text-foreground rounded-lg p-6 max-w-3xl w-full shadow-2xl">
        <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
          <h2 className="text-2xl font-bold text-primary">{payload.badge?.name || payload.credentialSubject?.moduleTitle || payload.credentialSubject?.courseTitle || 'Untitled Credential'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">&times;</button>
        </div>
        
        <div className="prose dark:prose-invert max-w-none text-sm space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Recipient</h3>
            <p><strong>Name:</strong> {recipientName}</p>
            <p><strong>Email:</strong> {recipientEmail}</p>
            <p><strong>Registration #:</strong> {recipientRegNumber}</p>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="font-semibold text-lg mb-2">Issuance Details</h3>
            <p><strong>Issued By:</strong> {payload.badge?.issuer?.name || payload.issuer?.name || 'Unknown Issuer'}</p>
            <p><strong>Issued On:</strong> {new Date(payload.issuanceDate).toLocaleDateString()}</p>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="font-semibold text-lg mb-2">Credential Details</h3>
            <p><strong>Description:</strong> {description}</p>
            <p><strong>Narrative:</strong> {payload.badge?.criteria?.narrative || 'No narrative available.'}</p>
            { (payload.badge?.result || payload.result) && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p><strong>Score:</strong> <span className="font-mono">{(payload.badge?.result?.score || payload.result?.score)?.toFixed(2)}%</span></p>
                <p><strong>Descriptor:</strong> <span className="font-mono bg-primary/20 text-primary px-2 py-1 rounded-full">{(payload.badge?.result?.descriptor || payload.result?.descriptor)}</span></p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CredentialDetailsModal;
