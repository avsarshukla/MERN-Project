const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      minlength: [5, 'Content must be at least 5 characters long']
    },
    image: {
      type: String,
      default: '',
      trim: true
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required']
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes for performant search and sorting
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1 });
postSchema.index({ category: 1 });
postSchema.index({ title: 'text', content: 'text' });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;

