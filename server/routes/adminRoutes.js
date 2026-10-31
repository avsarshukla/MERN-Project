const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAdminUsers,
  deleteAdminUser,
  updateAdminUserRole,
  getAdminPosts,
  deleteAdminPost,
  getAdminComments,
  deleteAdminComment
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All admin routes require both authentication and admin role
router.use(protect, admin);

// Admin stats
router.get('/stats', getAdminStats);

// User management endpoints
router.route('/users')
  .get(getAdminUsers);

router.route('/users/:id')
  .delete(deleteAdminUser);

router.route('/users/:id/role')
  .patch(updateAdminUserRole);

// Post moderation endpoints
router.route('/posts')
  .get(getAdminPosts);

router.route('/posts/:id')
  .delete(deleteAdminPost);

// Comment moderation endpoints
router.route('/comments')
  .get(getAdminComments);

router.route('/comments/:id')
  .delete(deleteAdminComment);

module.exports = router;

