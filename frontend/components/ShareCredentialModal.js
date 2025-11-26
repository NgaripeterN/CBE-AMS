import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../lib/api';

const ShareCredentialModal = ({ credential, onClose }) => {
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState('idle'); // idle, sending, sent, error
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    const generateLink = async () => {
      if (!credential) return;
      try {
        setLoading(true);
        const type = credential.module_id ? 'micro' : 'course';
        const res = await api.post(`/credentials/${type}/${credential.id}/share`);
        setShareLink(res.data.shareLink);
      } catch (err) {
        setError('Could not generate share link. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    generateLink();
  }, [credential]);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setEmailStatus('sending');
    setEmailError('');
    try {
      await api.post('/credentials/share/email', {
        recipientEmail: email,
        credential,
      });
      setEmailStatus('sent');
      setEmail('');
    } catch (err) {
      setEmailStatus('error');
      setEmailError(err.response?.data?.error || 'Failed to send email.');
    }
  };

  if (!credential) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl w-full text-gray-800 dark:text-white">
        <h2 className="text-2xl font-bold mb-4">Share Credential</h2>
        {loading ? (
            <p>Generating secure link...</p>
        ) : error ? (
            <p className="text-red-500">{error}</p>
        ) : (
            <div className="flex flex-col items-center">
              <QRCodeSVG value={shareLink} size={256} />
              <p className="mt-4 text-gray-600 dark:text-gray-300">Scan the QR code or use the link below to share (link is valid for 7 days):</p>
              <input
                type="text"
                readOnly
                value={shareLink}
                className="w-full mt-2 p-2 border rounded-lg text-center bg-gray-100 dark:bg-gray-700"
                onFocus={(e) => e.target.select()}
              />
            </div>
        )}

        <hr className="my-6 border-gray-300 dark:border-gray-600" />
        
        <div>
          <h3 className="text-xl font-bold mb-2">Email as Attachment</h3>
          <form onSubmit={handleSendEmail}>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Recipient's email address"
                required
                className="flex-grow p-2 border rounded-lg dark:bg-gray-700"
              />
              <button
                type="submit"
                disabled={emailStatus === 'sending'}
                className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400"
              >
                {emailStatus === 'sending' ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </form>
          {emailStatus === 'sent' && <p className="text-green-500 mt-2">Email sent successfully!</p>}
          {emailStatus === 'error' && <p className="text-red-500 mt-2">{emailError}</p>}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareCredentialModal;
