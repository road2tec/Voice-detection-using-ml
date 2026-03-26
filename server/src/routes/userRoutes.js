const express = require('express');
const Alert = require('../models/Alert');
const User = require('../models/User');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const users = await User.find({
      $and: [
        { email: { $not: /example\.com$/i } },
        { email: { $not: /test/i } },
        { name: { $not: /test/i } }
      ]
    }).sort({ createdAt: -1 }).lean();
    return res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

router.post('/seed', async (_req, res) => {
  try {
    const seedUsers = [
      { name: 'Abhi', email: 'abhi@example.com' },
      { name: 'Riya', email: 'riya@example.com' },
      { name: 'Admin Test User', email: 'admin.user@example.com' },
    ];

    await User.bulkWrite(
      seedUsers.map((user) => ({
        updateOne: {
          filter: { email: user.email },
          update: { $setOnInsert: user },
          upsert: true,
        },
      })),
      { ordered: false },
    );

    const users = await User.find().sort({ createdAt: -1 }).lean();
    return res.json(users);
  } catch (error) {
    console.error('Failed to seed users:', error);
    return res.status(500).json({ message: 'Failed to seed users.' });
  }
});

router.get('/:userId/alerts', async (req, res) => {
  try {
    const { userId } = req.params;

    const alerts = await Alert.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const normalized = alerts.map((alert) => ({
      ...alert,
      timestamp: alert.createdAt,
    }));

    return res.json(normalized);
  } catch (error) {
    console.error('Failed to fetch user alerts:', error);
    return res.status(500).json({ message: 'Failed to fetch user alerts.' });
  }
});

module.exports = router;
