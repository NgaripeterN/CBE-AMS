const prisma = require('../lib/prisma');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const generateShareLink = async (req, res) => {
  const { id, type } = req.params;
  const { userId } = req.user;

  try {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const model = type === 'micro' ? prisma.microCredential : prisma.courseCredential;
    const credential = await model.findUnique({ where: { id } });

    if (!credential || credential.student_id !== student.id) {
      return res.status(404).json({ error: 'Credential not found or you do not have permission to share it' });
    }

    const shareToken = crypto.randomBytes(32).toString('hex');
    const shareTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const updatedCredential = await model.update({
      where: { id },
      data: { shareToken, shareTokenExpiresAt },
    });

    const shareLink = `${process.env.FRONTEND_URL}/verify?token=${shareToken}`;

    res.json({ shareLink });
  } catch (error) {
    console.error('Error generating share link:', error);
    res.status(500).json({ error: 'An error occurred while generating the share link' });
  }
};

const sendShareEmail = async (req, res) => {
    const { recipientEmail, credential } = req.body;
    const { user } = req;

    if (!recipientEmail || !credential) {
        return res.status(400).json({ error: 'Recipient email and credential are required.' });
    }

    try {
        // Using Mailtrap for testing - user should replace with their SMTP provider
        const transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASS
            }
        });

        const credentialFileName = `${credential.payloadJson.badge.name.replace(/\s+/g, '_')}_credential.json`;

        const mailOptions = {
            from: "CBE-AMS Platform <no-reply@cbe-ams.com>",
            to: recipientEmail,
            subject: `You have received a credential from ${user.name}`,
            text: `Hello,\n\nPlease find attached the digital credential "${credential.payloadJson.badge.name}" from ${user.name}.\n\nYou can verify this credential by uploading the attached JSON file at ${process.env.FRONTEND_URL}/verify.\n\nThank you,\nThe CBE-AMS Team`,
            html: `<p>Hello,</p><p>Please find attached the digital credential <strong>"${credential.payloadJson.badge.name}"</strong> from ${user.name}.</p><p>You can verify this credential by uploading the attached JSON file at <a href="${process.env.FRONTEND_URL}/verify">${process.env.FRONTEND_URL}/verify</a>.</p><p>Thank you,<br/>The CBE-AMS Team</p>`,
            attachments: [
                {
                    filename: credentialFileName,
                    content: JSON.stringify(credential.payloadJson, null, 2),
                    contentType: 'application/json'
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent successfully!' });

    } catch (error) {
        console.error('Error sending share email:', error);
        res.status(500).json({ error: 'An error occurred while sending the email.' });
    }
};

module.exports = {
    generateShareLink,
    sendShareEmail,
};
