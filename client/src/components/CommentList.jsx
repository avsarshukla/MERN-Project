import React, { useState, useEffect } from 'react';
import commentService from '../services/commentService';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

const CommentList = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await commentService.getPostComments(postId);
      if (res.success) {
        setComments(res.data || []);
      } else {
        setError(res.message || 'Failed to load comments');
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const handleAddComment = async (content, resetForm) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await commentService.addComment(postId, content);
      if (res.success && res.data?.comment) {
        // Add new comment to the top of the list
        setComments((prev) => [res.data.comment, ...prev]);
        if (resetForm) resetForm();
      } else {
        setSubmitError(res.message || 'Failed to post comment');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setSubmitError(
        err.response?.data?.message || err.message || 'Failed to post comment'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId, newContent) => {
    const res = await commentService.updateComment(commentId, newContent);
    if (res.success && res.data?.comment) {
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? res.data.comment : c))
      );
    }
  };

  const handleDeleteComment = async (commentId) => {
    const res = await commentService.deleteComment(commentId);
    if (res.success) {
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    }
  };

  return (
    <section className="comments-section" id="comments">
      <div className="comments-header">
        <h3 className="comments-title">
          Discussion <span className="comments-count">({comments.length})</span>
        </h3>
      </div>

      {/* Comment submission form */}
      <CommentForm
        onSubmit={handleAddComment}
        isLoading={submitting}
        error={submitError}
      />

      {/* Comment list items */}
      <div className="comments-stream">
        {loading ? (
          <div className="comments-loading">
            <div className="btn-spinner"></div>
            <span>Loading discussion...</span>
          </div>
        ) : error ? (
          <div className="alert alert-danger comments-error">
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={fetchComments}
            >
              Retry
            </button>
          </div>
        ) : comments.length === 0 ? (
          <div className="comments-empty-state">
            <span className="comments-empty-icon">💬</span>
            <p>No comments yet.</p>
            <span className="comments-empty-sub">
              Be the first to share your thoughts on this post!
            </span>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onUpdate={handleUpdateComment}
              onDelete={handleDeleteComment}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default CommentList;

