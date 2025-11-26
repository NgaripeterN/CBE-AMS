const prisma = require('../lib/prisma');
const { verifyOnChain } = require('../lib/verifier');

const verifyCredential = async (req, res) => {
  const { credentialId, token, credential: credentialJson } = req.body;
  const userId = req.user?.userId;

  try {
    let dbCredential = null;
    let payload = null;

    if (credentialJson) {
        payload = credentialJson;
    } else {
        if (token) {
            dbCredential = await prisma.microCredential.findUnique({ where: { shareToken: token } })
            if (!dbCredential) {
                dbCredential = await prisma.courseCredential.findUnique({ where: { shareToken: token } });
            }
            if (dbCredential && dbCredential.shareTokenExpiresAt < new Date()) {
                return res.status(400).json({ error: 'Share link has expired.' });
            }
        } else if (credentialId) {
            dbCredential = await prisma.microCredential.findUnique({ where: { id: credentialId } });
            if (!dbCredential) {
                dbCredential = await prisma.courseCredential.findUnique({ where: { id: credentialId } });
            }
        }

        if (dbCredential) {
            payload = dbCredential.payloadJson;
        }
    }

    if (payload) {
      const verificationResult = await verifyOnChain(payload);
      return res.json({
        payload,
        verificationResult,
      });
    }

    res.status(404).json({ error: 'Credential not found or invalid token/ID' });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: 'An error occurred while verifying the credential' });
  }
};

module.exports = {
  verifyCredential,
};

