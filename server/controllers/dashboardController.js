const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

/**
 * @desc    Get dashboard metrics and activity for current authenticated user
 * @route   GET /api/dashboard/stats
 * @access  Private (Logged-in)
 */
const getUserDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Fetch user's own posts
    const userPosts = await Post.find({ author: userId }).sort({ createdAt: -1 });
    const userPostsCount = userPosts.length;

    // 2. Calculate total likes received across all user's posts
    const totalLikesReceived = userPosts.reduce((acc, post) => {
      return acc + (Array.isArray(post.likes) ? post.likes.length : 0);
    }, 0);

    // 3. Calculate total comments written by this user
    const userCommentsCount = await Comment.countDocuments({ author: userId });

    // 4. Calculate total comments received on user's posts
    const postIds = userPosts.map((p) => p._id);
    const totalCommentsReceived = postIds.length > 0
      ? await Comment.countDocuments({ post: { $in: postIds } })
      : 0;

    // 5. Global platform metrics (authorized public summaries)
    const [globalPostsCount, globalUsersCount] = await Promise.all([
      Post.countDocuments(),
      User.countDocuments()
    ]);

    // 6. Recent posts authored by the user (latest 5)
    const recentPosts = userPosts.slice(0, 5);

    // 7. Recent comments authored by the user (latest 5 with populated post title)
    const recentComments = await Comment.find({ author: userId })
      .populate('post', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          userPostsCount,
          totalLikesReceived,
          userCommentsCount,
          totalCommentsReceived,
          globalPostsCount,
          globalUsersCount
        },
        recentPosts,
        recentComments
      }
    });
  } catch (error) {
    console.error(`[DashboardStats Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving dashboard statistics'
    });
  }
};

module.exports = {
  getUserDashboardStats
};

