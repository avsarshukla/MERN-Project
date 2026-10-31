const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  getMyPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  toggleLikePost
} = require('../controllers/postController');
const {
  getCommentsByPost,
  addComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// Public route for browsing posts, protected for creating
router.route('/')
  .get(getPosts)
  .post(protect, createPost);

// Own posts routes - MUST BE REGISTERED BEFORE /:id to avoid treating "my" or "my-posts" as an ID
router.route('/my')
  .get(protect, getMyPosts);

router.route('/my-posts')
  .get(protect, getMyPosts);

// Likes endpoints for a post
router.route('/:id/like')
  .post(protect, likePost)
  .delete(protect, unlikePost)
  .put(protect, toggleLikePost);

// Comments endpoints for a post
router.route('/:postId/comments')
  .get(getCommentsByPost)
  .post(protect, addComment);

// Single post operations by ID
router.route('/:id')
  .get(getPostById)
  .put(protect, updatePost)
  .patch(protect, updatePost)
  .delete(protect, deletePost);

module.exports = router;
