const express = require('express');
const multer = require('multer');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { analyzeAudioWithGemini } = require('../services/geminiService');
const { sendDetectionEmail } = require('../services/emailService');
const { getSocket } = require('../socket');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

router.post('/analyze', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Audio file is required.' });
    }

    const { userId, latitude, longitude } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const base64Audio = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'audio/webm';

    const aiResult = await analyzeAudioWithGemini(base64Audio, mimeType, req.file.originalname || '');

    const alert = await Alert.create({
      userId,
      label: aiResult.label,
      danger: aiResult.danger,
      confidence: aiResult.confidence,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    });

    const payload = {
      id: alert._id,
      userId: user._id,
      userName: user.name,
      label: alert.label,
      danger: alert.danger,
      confidence: alert.confidence,
      latitude: alert.latitude,
      longitude: alert.longitude,
      timestamp: alert.createdAt,
    };

    const io = getSocket();
    io.emit('new-alert', payload);

    try {
      await sendDetectionEmail({
        user,
        label: alert.label,
        danger: alert.danger,
        confidence: alert.confidence,
        reason: aiResult.reason || null,
        timestamp: alert.createdAt,
        location: alert.latitude && alert.longitude ? { lat: alert.latitude, lng: alert.longitude } : null,
      });
    } catch (mailError) {
      console.error('Failed to send detection email:', mailError.message);
    }

    return res.json({
      label: alert.label,
      danger: alert.danger,
      confidence: alert.confidence,
      reason: aiResult.reason || null,
      modelUsed: aiResult.modelUsed || null,
      timestamp: alert.createdAt,
    });
  } catch (error) {
    console.error('Audio analyze error:', error);
    return res.status(500).json({ message: 'Failed to analyze audio.' });
  }
});

module.exports = router;
