const express = require('express');
const Alert = require('../models/Alert');
const User = require('../models/User');

const router = express.Router();

router.get('/users', async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    return res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

router.get('/alerts', async (_req, res) => {
  try {
    const alerts = await Alert.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'name email')
      .lean();

    const normalized = alerts.map((alert) => ({
      id: alert._id,
      userId: alert.userId?._id || null,
      userName: alert.userId?.name || 'Unknown User',
      userEmail: alert.userId?.email || '',
      label: alert.label,
      danger: alert.danger,
      confidence: alert.confidence,
      timestamp: alert.createdAt,
    }));

    return res.json(normalized);
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return res.status(500).json({ message: 'Failed to fetch alerts.' });
  }
});

module.exports = router;
