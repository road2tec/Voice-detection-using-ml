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

const sendDetectionEmail = async ({ user, label, danger, timestamp, confidence, reason, location }) => {
  const transporter = buildTransporter();
  const smtpUser = process.env.SMTP_USER;
  const adminEmail = process.env.ALERT_EMAIL_TO || smtpUser;
  const recipients = [adminEmail, user.email].filter(Boolean);
  const to = recipients.join(', ');

  const locationText = location ? `${location.lat}, ${location.lng}` : 'N/A';
  const mapsLink = location ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : '';

  if (!transporter || !smtpUser || !to) {
    return { skipped: true, message: 'SMTP is not configured.' };
  }

  const formattedTime = new Date(timestamp).toLocaleString();
  const confidenceText = typeof confidence === 'number' ? `${Math.round(confidence * 100)}%` : 'N/A';

  const subject = `[NoiseGuard AI] ${label} detected for ${user.name}`;
  const textLines = [
    'NoiseGuard AI Alert Notification',
    `User: ${user.name} (${user.email})`,
    `Detected Sound: ${label}`,
    `Danger: ${danger ? 'YES' : 'NO'}`,
    `Confidence: ${confidenceText}`,
    `Location (Coordinates): ${locationText}`,
    mapsLink ? `Map Link: ${mapsLink}` : '',
    `Timestamp: ${formattedTime}`,
    `Reason: ${reason || 'N/A'}`,
  ].filter(Boolean);

  const text = textLines.join('\n');

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
