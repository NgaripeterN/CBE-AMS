import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import api from '../lib/api';
import { useDropzone } from 'react-dropzone';
import OnboardingNav from '../components/OnboardingNav';
import { 
  CloudArrowUpIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  DocumentCheckIcon,
  ShieldCheckIcon,
  BookOpenIcon, // Added
  DocumentTextIcon, // Added
  CogIcon // Added
} from '@heroicons/react/24/outline';

const VerificationResult = ({ result }) => {
    if (!result) return null;

    const { payload, verificationResult } = result;
    const { isValid, reason, issuerAddress, timestamp } = verificationResult;

    let score = payload.credentialSubject?.score || payload.result?.score || payload.badge?.result?.score;
    const descriptor = payload.credentialSubject?.descriptor || payload.result?.descriptor || payload.badge?.result?.descriptor;
    const transcript = payload.credentialSubject?.transcript;
    const evidenceModules = payload.credentialSubject?.evidenceModules;
    const demonstratedCompetencies = payload.credentialSubject?.demonstratedCompetencies;

    // Fallback: Calculate weighted average if score is null/undefined but transcript exists
    if ((score === null || score === undefined) && transcript && transcript.length > 0) {
        let totalWeightedScore = 0;
        let totalWeight = 0;

        transcript.forEach(item => {
            const s = parseFloat(item.score);
            const w = parseFloat(item.weight) / 100; // Assuming weight is like "25%"
            if (!isNaN(s) && !isNaN(w)) {
                totalWeightedScore += (s * w);
                totalWeight += w;
            }
        });

        if (totalWeight > 0) {
            score = totalWeightedScore / totalWeight;
        }
    }

    return (
        <div className={`mt-8 overflow-hidden rounded-xl border shadow-lg transition-all duration-300 ${isValid ? 'border-green-500/50 bg-green-50/50 dark:bg-green-900/10' : 'border-red-500/50 bg-red-50/50 dark:bg-red-900/10'}`}>
            <div className={`p-6 flex items-center gap-4 border-b ${isValid ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}`}>
                {isValid ? (
                    <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                ) : (
                    <XCircleIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
                )}
                <div>
                    <h2 className={`text-2xl font-bold ${isValid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {isValid ? 'Credential Verified' : 'Verification Failed'}
                    </h2>
                    {!isValid && <p className="text-red-600 dark:text-red-400 font-medium mt-1">{reason}</p>}
                </div>
            </div>
            
            <div className="p-6 grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                        <DocumentCheckIcon className="h-5 w-5 text-primary" />
                        Credential Details
                    </h3>
                    <dl className="space-y-3 text-sm">
                        <div className="flex flex-col">
                            <dt className="text-muted-foreground">Subject</dt>
                            <dd className="font-medium text-foreground">{payload.credentialSubject?.name || 'Not available'}</dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="text-muted-foreground">Email</dt>
                            <dd className="font-medium text-foreground">{payload.recipient?.identity || 'Not available'}</dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="text-muted-foreground">Registration Number</dt>
                            <dd className="font-medium text-foreground">{payload.credentialSubject?.registrationNumber || 'Not available'}</dd>
                        </div>
                         <div className="flex flex-col">
                            <dt className="text-muted-foreground">Title</dt>
                            <dd className="font-medium text-foreground">{payload.badge?.name || 'Not available'}</dd>
                        </div>
                        {score !== undefined && score !== null && (
                            <>
                                <div className="flex flex-col">
                                    <dt className="text-muted-foreground">Weighted Average</dt>
                                    <dd className="font-bold text-primary">{Number(score).toFixed(2)}%</dd>
                                </div>
                            </>
                        )}
                        {descriptor && (
                            <div className="flex flex-col">
                                <dt className="text-muted-foreground">Descriptor</dt>
                                <dd className="font-medium text-foreground">
                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-mono border border-primary/20">
                                        {descriptor}
                                    </span>
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>

                <div className="space-y-4">
                     <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                        <ShieldCheckIcon className="h-5 w-5 text-primary" />
                        Issuance Information
                    </h3>
                    <dl className="space-y-3 text-sm">
                        <div className="flex flex-col">
                            <dt className="text-muted-foreground">Issued By</dt>
                            <dd className="font-medium text-foreground">{payload.badge?.issuer?.name || 'Not available'}</dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="text-muted-foreground">Issued On</dt>
                            <dd className="font-medium text-foreground">{payload.issuanceDate ? new Date(payload.issuanceDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Not available'}</dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="text-muted-foreground">Description</dt>
                            <dd className="font-medium text-foreground line-clamp-3">{payload.badge?.description || 'Not available'}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            {transcript && transcript.length > 0 && (
                <div className="border-t border-border pt-4 p-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground mb-3">
                        <BookOpenIcon className="h-5 w-5 text-primary" />
                        Transcript
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        {transcript.map((item, index) => (
                            <div key={index} className="bg-muted/50 p-3 rounded-md">
                                <p><strong>Year {item.year}:</strong> <span className="font-mono">{item.score}%</span></p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {evidenceModules && evidenceModules.length > 0 && (
                <div className="border-t border-border pt-4 p-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground mb-3">
                        <DocumentTextIcon className="h-5 w-5 text-primary" />
                        Evidence Modules
                    </h3>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                        {evidenceModules.map((module, index) => (
                            <li key={index} className="text-foreground">{module.title}</li>
                        ))}
                    </ul>
                </div>
            )}

            {demonstratedCompetencies && demonstratedCompetencies.length > 0 && (
                <div className="border-t border-border pt-4 p-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground mb-3">
                        <CogIcon className="h-5 w-5 text-primary" />
                        Demonstrated Competencies
                    </h3>
                    <div className="flex flex-wrap gap-2 text-sm">
                        {demonstratedCompetencies.map((comp, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-3 py-1 rounded-full text-xs font-medium">
                                {comp.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {isValid && (
                <div className="bg-muted/30 p-4 border-t border-border text-xs text-muted-foreground flex flex-col md:flex-row justify-between gap-2">
                    <p><span className="font-semibold">Issuer Address:</span> {issuerAddress}</p>
                    <p><span className="font-semibold">Verified On:</span> {new Date(timestamp).toLocaleString()}</p>
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
    multiple: false
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
    <>
      <Head>
        <title>Verify Credential - CBE-AMS</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
        <OnboardingNav />
        
        <main className="flex-grow max-w-4xl mx-auto px-6 py-12 w-full">
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground pb-2">
                    Verify Authenticity
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                    Ensure the validity of academic credentials securely. Upload the credential file to check its digital signature and blockchain record.
                </p>
            </div>

          <div 
            {...getRootProps()} 
            className={`
                relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
                flex flex-col items-center justify-center p-12 text-center group
                ${isDragActive 
                    ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-4 ring-primary/10' 
                    : 'border-slate-300 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }
            `}
          >
            <input {...getInputProps()} />
            
            <div className={`
                p-4 rounded-full mb-4 transition-transform duration-300 group-hover:scale-110
                ${isDragActive ? 'bg-primary/10 dark:bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}
            `}>
                <CloudArrowUpIcon className="h-10 w-10" />
            </div>

            <p className="text-xl font-medium mb-2 text-slate-900 dark:text-white">
                {isDragActive ? 'Drop the file here' : 'Upload Credential File'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                Drag and drop your JSON credential file here, or click to browse your device.
            </p>
          </div>

          <div className="min-h-[100px] mt-8">
            {loading && (
                <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in duration-300">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 animate-pulse">Verifying cryptographic signature...</p>
                </div>
            )}

            {error && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                    <XCircleIcon className="h-5 w-5" />
                    <span className="font-medium">{error}</span>
                </div>
            )}
            
            <VerificationResult result={verificationResult} />
          </div>
        </main>
      </div>
    </>
  );
};

export default VerifyCredential;