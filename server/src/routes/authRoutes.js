const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

const ADMIN_EMAIL = 'moresayali180@gmail.com';
const ADMIN_PASSWORD = 'NoiseGuard@AI123';

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: 'user',
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (email.toLowerCase() === ADMIN_EMAIL) {
      return res.status(400).json({ message: 'This email is reserved for admin.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });

    if (existing) {
      return res.status(409).json({ message: 'User already exists with this email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    return res.status(201).json({
      message: 'Signup successful.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Signup failed:', error);
    return res.status(500).json({ message: 'Signup failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required.' });
    }

    if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return res.json({
        message: 'Admin login successful.',
        user: {
          id: 'admin-fixed',
          name: 'Admin',
          email: ADMIN_EMAIL,
          role: 'admin',
        },
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    return res.json({
      message: 'Login successful.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ message: 'Login failed.' });
  }
});

module.exports = router;
