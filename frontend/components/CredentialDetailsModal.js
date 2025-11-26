import React from 'react';

const CredentialDetailsModal = ({ credential, onClose }) => {
  if (!credential) {
    return null;
  }

  // Safely parse the payload if it's a string
  const payload = typeof credential.payloadJson === 'string' 
    ? JSON.parse(credential.payloadJson) 
    : credential.payloadJson;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-card text-foreground rounded-lg p-6 max-w-3xl w-full shadow-2xl">
        <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
          <h2 className="text-2xl font-bold text-primary">{payload.badge.name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">&times;</button>
        </div>
        
        <div className="prose dark:prose-invert max-w-none text-sm space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Recipient</h3>
            <p><strong>Name:</strong> {payload.credentialSubject.name}</p>
            <p><strong>Email:</strong> {payload.recipient.identity}</p>
            <p><strong>Registration #:</strong> {payload.credentialSubject.regNumber}</p>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="font-semibold text-lg mb-2">Issuance Details</h3>
            <p><strong>Issued By:</strong> {payload.badge.issuer.name}</p>
            <p><strong>Issued On:</strong> {new Date(payload.issuedOn).toLocaleDateString()}</p>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="font-semibold text-lg mb-2">Credential Details</h3>
            <p><strong>Description:</strong> {payload.badge.description}</p>
            <p><strong>Narrative:</strong> {payload.badge.criteria.narrative}</p>
            {payload.badge.result && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p><strong>Score:</strong> <span className="font-mono">{payload.badge.result.score.toFixed(2)}%</span></p>
                <p><strong>Descriptor:</strong> <span className="font-mono bg-primary/20 text-primary px-2 py-1 rounded-full">{payload.badge.result.descriptor}</span></p>
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
