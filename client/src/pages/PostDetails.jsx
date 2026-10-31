import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import postService from '../services/postService';
import ConfirmationModal from '../components/ConfirmationModal';
import LikeButton from '../components/LikeButton';
import CommentList from '../components/CommentList';

const PostDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await postService.getPostById(id);
        if (res.success && res.data?.post) {
          setPost(res.data.post);
        } else {
          setError(res.message || 'Post not found');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(err.response?.data?.message || err.message || 'Error loading post details');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await postService.deletePost(id);
      if (res.success) {
        setIsDeleteModalOpen(false);
        navigate('/', { replace: true });
      } else {
        setDeleteError(res.message || 'Failed to delete post');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      setDeleteError(err.response?.data?.message || err.message || 'Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="post-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading post details...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-detail-error-container">
        <div className="alert alert-danger">
          <h3>Post Not Found</h3>
          <p>{error || 'The requested post could not be loaded.'}</p>
        </div>
        <Link to="/" className="btn btn-outline">
          &larr; Back to all posts
        </Link>
      </div>
    );
  }

  const authorId = post.author?._id || post.author;
  const isOwner = user && (user._id === authorId || user.role === 'admin');
  const authorName = post.author?.name || 'Anonymous Author';
  const authorImage = post.author?.profileImage;

  const formattedCreated = new Date(post.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedUpdated =
    post.updatedAt && post.updatedAt !== post.createdAt
      ? new Date(post.updatedAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : null;

  return (
    <div className="post-detail-container">
      {/* Navigation breadcrumb */}
      <nav className="breadcrumb-nav">
        <Link to="/" className="breadcrumb-link">
          &larr; Back to Feed
        </Link>
        {isOwner && (
          <span className="owner-badge">
            {user?.role === 'admin' && user._id !== authorId ? 'Admin Mode' : 'You are the author'}
          </span>
        )}
      </nav>

      {/* Main Post Header */}
      <header className="post-detail-header">
        <div className="post-detail-tags">
          <span className="post-category-tag">{post.category || 'General'}</span>
          {formattedUpdated && (
            <span className="post-edited-tag">Edited: {formattedUpdated}</span>
          )}
        </div>

        <h1 className="post-detail-title">{post.title}</h1>

        <div className="post-detail-author-bar">
          <div className="author-meta-block">
            {authorImage ? (
              <img
                src={authorImage}
                alt={authorName}
                className="avatar-md"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="avatar-placeholder-md">
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="author-text-info">
              <span className="author-name-lg">{authorName}</span>
              <span className="post-date-lg">Published on {formattedCreated}</span>
            </div>
          </div>

          {/* Action buttons for owner or admin */}
          {isOwner && (
            <div className="post-detail-actions">
              <Link
                to={`/posts/${post._id}/edit`}
                className="btn btn-outline btn-edit-post"
              >
                ✏️ Edit Post
              </Link>
              <button
                type="button"
                className="btn btn-outline-danger btn-delete-post"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                🗑️ Delete Post
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Optional Featured Image */}
      {post.image && (
        <div className="post-detail-image-wrap">
          <img
            src={post.image}
            alt={post.title}
            className="post-detail-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Post Article Body */}
      <article className="post-detail-body">
        {post.content.split('\n').map((paragraph, index) =>
          paragraph.trim() ? (
            <p key={index} className="post-paragraph">
              {paragraph}
            </p>
          ) : (
            <br key={index} />
          )
        )}
      </article>

      {/* Social Interactions: Likes */}
      <section className="post-interactions-section">
        <div className="interaction-bar">
          <LikeButton
            postId={post._id}
            initialLikes={post.likes || []}
            size="lg"
            showLabel={true}
          />
          <a href="#comments" className="comments-jump-link">
            💬 Jump to Discussion
          </a>
        </div>
      </section>

      {/* Discussion / Comments Thread */}
      <CommentList postId={post._id} />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Post"
        message={`Are you sure you want to permanently delete "${post.title}"? This action cannot be undone.`}
        confirmText="Yes, Delete Post"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeleteError(null);
        }}
      />

      {deleteError && (
        <div className="alert alert-danger delete-error-banner">
          {deleteError}
        </div>
      )}
    </div>
  );
};

export default PostDetails;

