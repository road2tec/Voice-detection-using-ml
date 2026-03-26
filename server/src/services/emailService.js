const nodemailer = require('nodemailer');

const buildTransporter = () => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

const sendDetectionEmail = async ({ user, label, danger, timestamp, confidence, reason }) => {
  const transporter = buildTransporter();
  const smtpUser = process.env.SMTP_USER;
  const to = process.env.ALERT_EMAIL_TO || smtpUser;

  if (!transporter || !smtpUser || !to) {
    return { skipped: true, message: 'SMTP is not configured.' };
  }

  const formattedTime = new Date(timestamp).toLocaleString();
  const confidenceText = typeof confidence === 'number' ? `${Math.round(confidence * 100)}%` : 'N/A';

  const subject = `[NoiseGuard AI] ${label} detected for ${user.name}`;
  const text = [
    'NoiseGuard AI Alert Notification',
    `User: ${user.name} (${user.email})`,
    `Detected Sound: ${label}`,
    `Danger: ${danger ? 'YES' : 'NO'}`,
    `Confidence: ${confidenceText}`,
    `Timestamp: ${formattedTime}`,
    `Reason: ${reason || 'N/A'}`,
  ].join('\n');

  await transporter.sendMail({
    from: smtpUser,
    to,
    subject,
    text,
  });

  return { skipped: false };
};

module.exports = {
  sendDetectionEmail,
};
