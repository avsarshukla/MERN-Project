const express = require('express');
const router = express.Router();
const {
  updateComment,
  deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// Update and Delete comment by comment ID (Protected: Owner or Admin)
router.route('/:id')
  .put(protect, updateComment)
  .delete(protect, deleteComment);

module.exports = router;

