const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

/**
 * @desc    Create a new post
 * @route   POST /api/posts
 * @access  Private (Logged-in)
 */
const createPost = async (req, res) => {
  try {
    const { title, content, image, category } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post title is required'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required'
      });
    }

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (trimmedTitle.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Post title must be at least 3 characters long'
      });
    }

    if (trimmedTitle.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Post title cannot exceed 200 characters'
      });
    }

    if (trimmedContent.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Post content must be at least 5 characters long'
      });
    }

    // Always derive author from authenticated req.user - never trust client payload
    const post = await Post.create({
      title: trimmedTitle,
      content: trimmedContent,
      image: typeof image === 'string' ? image.trim() : '',
      category: typeof category === 'string' && category.trim() ? category.trim() : 'General',
      author: req.user._id,
      likes: []
    });

    // Populate author information for immediate client rendering
    await post.populate('author', 'name email profileImage role');

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post
      }
    });
  } catch (error) {
    console.error(`[CreatePost Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating post'
    });
  }
};

/**
 * @desc    Get all posts with pagination, search, and filtering
 * @route   GET /api/posts
 * @access  Public
 */
const getPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};

    // Search query on title and content
    if (req.query.search && req.query.search.trim()) {
      const searchTerm = req.query.search.trim();
      filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Category filter
    if (req.query.category && req.query.category.trim() && req.query.category.toLowerCase() !== 'all') {
      filter.category = { $regex: new RegExp(`^${req.query.category.trim()}$`, 'i') };
    }

    // Author filter
    if (req.query.author && req.query.author.trim()) {
      if (mongoose.Types.ObjectId.isValid(req.query.author)) {
        filter.author = req.query.author;
      }
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (req.query.sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (req.query.sort === 'title_asc') {
      sortOption = { title: 1 };
    } else if (req.query.sort === 'title_desc') {
      sortOption = { title: -1 };
    }

    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .populate('author', 'name email profileImage role')
      .sort(sortOption)
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
    console.error(`[GetPosts Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving posts'
    });
  }
};

/**
 * @desc    Get authenticated user's own posts
 * @route   GET /api/posts/my or GET /api/posts/my-posts
 * @access  Private (Logged-in)
 */
const getMyPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { author: req.user._id };

    // Search within user's own posts
    if (req.query.search && req.query.search.trim()) {
      const searchTerm = req.query.search.trim();
      filter.$and = [
        {
          $or: [
            { title: { $regex: searchTerm, $options: 'i' } },
            { content: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      ];
    }

    // Category filter
    if (req.query.category && req.query.category.trim() && req.query.category.toLowerCase() !== 'all') {
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
    console.error(`[GetMyPosts Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error retrieving user's posts"
    });
  }
};

/**
 * @desc    Get single post by ID
 * @route   GET /api/posts/:id
 * @access  Public
 */
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format'
      });
    }

    const post = await Post.findById(id).populate('author', 'name email profileImage role');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        post
      }
    });
  } catch (error) {
    console.error(`[GetPostById Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving post'
    });
  }
};

/**
 * @desc    Update an existing post
 * @route   PUT /api/posts/:id or PATCH /api/posts/:id
 * @access  Private (Owner or Admin)
 */
const updatePost = async (req, res) => {
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

    // Ownership check: only the author or an admin can update
    const isOwner = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to update this post'
      });
    }

    const { title, content, image, category } = req.body;

    // Validate updates if provided
    if (title !== undefined) {
      const trimmedTitle = title.trim();
      if (trimmedTitle.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Post title must be at least 3 characters long'
        });
      }
      if (trimmedTitle.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Post title cannot exceed 200 characters'
        });
      }
      post.title = trimmedTitle;
    }

    if (content !== undefined) {
      const trimmedContent = content.trim();
      if (trimmedContent.length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Post content must be at least 5 characters long'
        });
      }
      post.content = trimmedContent;
    }

    if (image !== undefined) {
      post.image = typeof image === 'string' ? image.trim() : '';
    }

    if (category !== undefined) {
      post.category = typeof category === 'string' && category.trim() ? category.trim() : 'General';
    }

    const updatedPost = await post.save();
    await updatedPost.populate('author', 'name email profileImage role');

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: {
        post: updatedPost
      }
    });
  } catch (error) {
    console.error(`[UpdatePost Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating post'
    });
  }
};

/**
 * @desc    Delete an existing post
 * @route   DELETE /api/posts/:id
 * @access  Private (Owner or Admin)
 */
const deletePost = async (req, res) => {
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

    // Ownership check: only author or admin can delete
    const isOwner = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to delete this post'
      });
    }

    // Cascade delete any comments belonging to this post
    await Comment.deleteMany({ post: post._id });

    await post.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
      data: {
        id
      }
    });
  } catch (error) {
    console.error(`[DeletePost Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting post'
    });
  }
};

/**
 * @desc    Like a post
 * @route   POST /api/posts/:id/like
 * @access  Private (Logged-in)
 */
const likePost = async (req, res) => {
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

    // Check for duplicate like
    const alreadyLiked = post.likes.some(
      (likeId) => likeId.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      return res.status(400).json({
        success: false,
        message: 'Post already liked by this user'
      });
    }

    // Atomically add like to prevent race conditions
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $addToSet: { likes: req.user._id } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Post liked successfully',
      data: {
        likesCount: updatedPost.likes.length,
        isLiked: true,
        likes: updatedPost.likes
      }
    });
  } catch (error) {
    console.error(`[LikePost Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error liking post'
    });
  }
};

/**
 * @desc    Unlike a post
 * @route   DELETE /api/posts/:id/like
 * @access  Private (Logged-in)
 */
const unlikePost = async (req, res) => {
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

    const hasLiked = post.likes.some(
      (likeId) => likeId.toString() === req.user._id.toString()
    );

    if (!hasLiked) {
      return res.status(400).json({
        success: false,
        message: 'Post has not been liked by this user yet'
      });
    }

    // Atomically pull like
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $pull: { likes: req.user._id } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Post unliked successfully',
      data: {
        likesCount: updatedPost.likes.length,
        isLiked: false,
        likes: updatedPost.likes
      }
    });
  } catch (error) {
    console.error(`[UnlikePost Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error unliking post'
    });
  }
};

/**
 * @desc    Toggle like status on a post
 * @route   PUT /api/posts/:id/like
 * @access  Private (Logged-in)
 */
const toggleLikePost = async (req, res) => {
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

    const isCurrentlyLiked = post.likes.some(
      (likeId) => likeId.toString() === req.user._id.toString()
    );

    let updatedPost;
    if (isCurrentlyLiked) {
      updatedPost = await Post.findByIdAndUpdate(
        id,
        { $pull: { likes: req.user._id } },
        { new: true }
      );
    } else {
      updatedPost = await Post.findByIdAndUpdate(
        id,
        { $addToSet: { likes: req.user._id } },
        { new: true }
      );
    }

    const isLiked = !isCurrentlyLiked;

    return res.status(200).json({
      success: true,
      message: isLiked ? 'Post liked successfully' : 'Post unliked successfully',
      data: {
        likesCount: updatedPost.likes.length,
        isLiked,
        likes: updatedPost.likes
      }
    });
  } catch (error) {
    console.error(`[ToggleLike Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error toggling like'
    });
  }
};

module.exports = {
  createPost,
  getPosts,
  getMyPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  toggleLikePost
};

