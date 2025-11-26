import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';
import { useDropzone } from 'react-dropzone';
import ThemeSwitcher from '../components/ThemeSwitcher';

const VerificationResult = ({ result }) => {
    if (!result) return null;

    const { payload, verificationResult } = result;
    const { isValid, reason, issuerAddress, timestamp } = verificationResult;

    return (
        <div className={`mt-8 border-2 p-6 rounded-lg ${isValid ? 'border-green-500' : 'border-red-500'} bg-background`}>
            <h2 className={`text-3xl font-bold mb-4 ${isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isValid ? '✓ Credential Verified' : '✗ Verification Failed'}
            </h2>
            {!isValid && <p className="text-red-700 dark:text-red-300 font-semibold">Reason: {reason}</p>}
            
            <div className="mt-6 space-y-2 text-foreground">
                <h3 className="text-xl font-semibold border-b pb-2 border-border">Credential Details</h3>
                <p><strong>Subject:</strong> {payload.credentialSubject?.name || 'Not available'}</p>
                <p><strong>Email:</strong> {payload.recipient?.identity || 'Not available'}</p>
                <p><strong>Registration Number:</strong> {payload.credentialSubject?.regNumber || 'Not available'}</p>
                <p><strong>Title:</strong> {payload.badge?.name || 'Not available'}</p>
                <p><strong>Description:</strong> {payload.badge?.description || 'Not available'}</p>
                <p><strong>Issued By:</strong> {payload.badge?.issuer?.name || 'Not available'}</p>
                <p><strong>Issued On:</strong> {payload.issuedOn ? new Date(payload.issuedOn).toLocaleDateString() : 'Not available'}</p>
            </div>

            {isValid && (
                <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                    <h3 className="text-xl font-semibold border-b pb-2 border-border text-foreground">Blockchain Details</h3>
                    <p><strong>Issuer Address:</strong> {issuerAddress}</p>
                    <p><strong>Verified On:</strong> {new Date(timestamp).toLocaleString()}</p>
                </div>
            )}
        </div>
    );
};

const VerifyCredential = () => {
  const router = useRouter();
  const { token, credentialId } = router.query;
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const credential = JSON.parse(reader.result);
        handleVerify({ credential });
      } catch (e) {
        setError('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
    },
  });

  const handleVerify = async (body) => {
    setLoading(true);
    setError('');
    setVerificationResult(null);
    try {
      const { data } = await api.post('/verify', body);
      setVerificationResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify credential.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      handleVerify({ token });
    } else if (credentialId) {
      handleVerify({ credentialId });
    }
  }, [token, credentialId]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold text-foreground">Credential Verification</h1>
        <ThemeSwitcher />
      </div>
      <p className="text-muted-foreground mb-8">Verify the authenticity of a credential by uploading its JSON file or using a share link.</p>

      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer ${isDragActive ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}>
        <input {...getInputProps()} />
        {isDragActive ?
          <p>Drop the JSON file here ...</p> :
          <p>Drag &#39;n&#39; drop a credential JSON file here, or click to select a file.</p>}
      </div>

      {loading && <p className="text-center mt-4">Verifying...</p>}
      {error && <p className="text-destructive text-center mt-4">{error}</p>}
      
      <VerificationResult result={verificationResult} />

    </div>
  );
};

export default VerifyCredential;
