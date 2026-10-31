const express = require('express');
const router = express.Router();
const { getUserDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// Get personal user dashboard statistics (Protected: Logged-in)
router.get('/stats', protect, getUserDashboardStats);

module.exports = router;

