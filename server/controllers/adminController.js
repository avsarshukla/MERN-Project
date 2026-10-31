const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

/**
 * @desc    Get system-wide metrics and statistics
 * @route   GET /api/admin/stats
 * @access  Private (Admin only)
 */
const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalPosts, totalComments, adminCount, regularUserCount] =
      await Promise.all([
        User.countDocuments(),
        Post.countDocuments(),
        Comment.countDocuments(),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ role: 'user' })
      ]);

    // Aggregate total likes across all posts
    const likesAgg = await Post.aggregate([
      { $project: { count: { $size: { $ifNull: ['$likes', []] } } } },
      { $group: { _id: null, total: { $sum: '$count' } } }
    ]);
    const totalLikes = likesAgg.length > 0 ? likesAgg[0].total : 0;

    // Categories breakdown
    const categoriesCount = await Post.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent activities for moderation overview
    const [recentUsers, recentPosts, recentComments] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).limit(5),
      Post.find().populate('author', 'name email').sort({ createdAt: -1 }).limit(5),
      Comment.find()
        .populate('author', 'name email')
        .populate('post', 'title')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalPosts,
          totalComments,
          totalLikes,
          adminCount,
          regularUserCount
        },
        categoriesCount,
        recentUsers,
        recentPosts,
        recentComments
      }
    });
  } catch (error) {
    console.error(`[AdminStats Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving admin statistics'
    });
  }
};

/**
 * @desc    List all users with pagination, search, and role filtering
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
const getAdminUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.search && req.query.search.trim()) {
      const term = req.query.search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } }
      ];
    }

    if (req.query.role && ['user', 'admin'].includes(req.query.role)) {
      filter.role = req.query.role;
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      data: users
    });
  } catch (error) {
    console.error(`[AdminGetUsers Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving users'
    });
  }
};

/**
 * @desc    Delete a user and cascade delete their posts, comments, and likes
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin only)
 */
const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Prevent administrator from deleting their own account
    if (req.user._id.toString() === id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot delete their own account'
      });
    }

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 1. Find all posts created by this user
    const userPosts = await Post.find({ author: id });
    const postIds = userPosts.map((p) => p._id);

    // 2. Cascade delete all comments associated with this user's posts
    if (postIds.length > 0) {
      await Comment.deleteMany({ post: { $in: postIds } });
    }

    // 3. Delete all posts authored by this user
    await Post.deleteMany({ author: id });

    // 4. Delete all comments authored by this user across any posts
    await Comment.deleteMany({ author: id });

    // 5. Remove user's ID from any posts they liked
    await Post.updateMany({}, { $pull: { likes: id } });

    // 6. Delete user record
    await userToDelete.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'User and all associated content deleted successfully',
      data: { id }
    });
  } catch (error) {
    console.error(`[AdminDeleteUser Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting user'
    });
  }
};

/**
 * @desc    Update a user's role (user <-> admin)
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private (Admin only)
 */
const updateAdminUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Role must be "user" or "admin"'
      });
    }

    // Prevent administrator from revoking their own admin role
    if (req.user._id.toString() === id.toString() && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot revoke their own admin privileges'
      });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`,
      data: { user }
    });
  } catch (error) {
    console.error(`[AdminUpdateRole Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating user role'
    });
  }
};

/**
 * @desc    List all posts across platform for admin moderation
 * @route   GET /api/admin/posts
 * @access  Private (Admin only)
 */
const getAdminPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.search && req.query.search.trim()) {
      const term = req.query.search.trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { content: { $regex: term, $options: 'i' } }
      ];
    }

    if (req.query.category && req.query.category !== 'All') {
      filter.category = { $regex: new RegExp(`^${req.query.category.trim()}$`, 'i') };
    }

    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .populate('author', 'name email profileImage role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      data: posts
    });
  } catch (error) {
    console.error(`[AdminGetPosts Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving posts'
    });
  }
};

/**
 * @desc    Moderate and delete any post
 * @route   DELETE /api/admin/posts/:id
 * @access  Private (Admin only)
 */
const deleteAdminPost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format'
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Cascade delete all comments on this post
    await Comment.deleteMany({ post: post._id });

    // Delete the post
    await post.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Post moderated and deleted successfully',
      data: { id }
    });
  } catch (error) {
    console.error(`[AdminDeletePost Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error moderating post'
    });
  }
};

/**
 * @desc    List all comments across platform for admin moderation
 * @route   GET /api/admin/comments
 * @access  Private (Admin only)
 */
const getAdminComments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.search && req.query.search.trim()) {
      filter.content = { $regex: req.query.search.trim(), $options: 'i' };
    }

    const total = await Comment.countDocuments(filter);
    const comments = await Comment.find(filter)
      .populate('author', 'name email role profileImage')
      .populate('post', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: comments.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      data: comments
    });
  } catch (error) {
    console.error(`[AdminGetComments Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving comments'
    });
  }
};

/**
 * @desc    Moderate and delete any comment
 * @route   DELETE /api/admin/comments/:id
 * @access  Private (Admin only)
 */
const deleteAdminComment = async (req, res) => {
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

    await comment.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Comment moderated and deleted successfully',
      data: { id }
    });
  } catch (error) {
    console.error(`[AdminDeleteComment Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error moderating comment'
    });
  }
};

module.exports = {
  getAdminStats,
  getAdminUsers,
  deleteAdminUser,
  updateAdminUserRole,
  getAdminPosts,
  deleteAdminPost,
  getAdminComments,
  deleteAdminComment
};

