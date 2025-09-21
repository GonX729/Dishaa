const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const aiService = require('../services/aiService');

const router = express.Router();

/**
 * GET /api/career-guide/:userId
 * Returns a personalized beginner career guide for the user
 */
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const guide = await aiService.generateBeginnerCareerGuide(user.toObject());

    res.status(200).json({ success: true, data: guide });
  } catch (error) {
    console.error('Career guide error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate career guide' });
  }
});

module.exports = router;
