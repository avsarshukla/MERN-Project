const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

/**
 * @desc    Get all comments for a specific post
 * @route   GET /api/posts/:postId/comments
 * @access  Public
 */
const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format'
      });
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comments = await Comment.find({ post: postId })
      .populate('author', 'name email profileImage role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error(`[GetComments Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving comments'
    });
  }
};

/**
 * @desc    Add a comment to a post
 * @route   POST /api/posts/:postId/comments
 * @access  Private (Logged-in)
 */
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format'
      });
    }

    // Validate content presence and non-whitespace
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty'
      });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 1000 characters'
      });
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Create comment document
    const comment = await Comment.create({
      content: trimmedContent,
      author: req.user._id,
      post: postId
    });

    await comment.populate('author', 'name email profileImage role');

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment
      }
    });
  } catch (error) {
    console.error(`[AddComment Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error adding comment'
    });
  }
};

/**
 * @desc    Update an existing comment
 * @route   PUT /api/comments/:id
 * @access  Private (Owner or Admin)
 */
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID format'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty'
      });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 1000 characters'
      });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Ownership check: only comment author or an admin can edit
    const isOwner = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to edit this comment'
      });
    }

    comment.content = trimmedContent;
    await comment.save();
    await comment.populate('author', 'name email profileImage role');

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        comment
      }
    });
  } catch (error) {
    console.error(`[UpdateComment Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating comment'
    });
  }
};

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:id
 * @access  Private (Owner or Admin)
 */
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID format'
      });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Ownership check: only comment author or an admin can delete
    const isOwner = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to delete this comment'
      });
    }

    await comment.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      data: {
        id
      }
    });
  } catch (error) {
    console.error(`[DeleteComment Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting comment'
    });
  }
};

module.exports = {
  getCommentsByPost,
  addComment,
  updateComment,
  deleteComment
};

