import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const CommentForm = ({ onSubmit, isLoading = false, error = null }) => {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [validationError, setValidationError] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="comment-login-prompt">
        <p>Want to join the conversation?</p>
        <Link to="/login" className="btn btn-sm btn-primary">
          Sign In to Comment
        </Link>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = content.trim();

    if (!trimmed) {
      setValidationError('Please write a comment before submitting.');
      return;
    }

    if (trimmed.length > 1000) {
      setValidationError('Comment cannot exceed 1000 characters.');
      return;
    }

    setValidationError('');
    onSubmit(trimmed, () => {
      setContent('');
    });
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit} noValidate>
      <div className="comment-form-header">
        <div className="comment-author-badge">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
              className="avatar-xs"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="avatar-placeholder-xs">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="commenting-as">Commenting as <strong>{user?.name}</strong></span>
        </div>
        <span className="comment-char-counter">
          {content.length}/1000
        </span>
      </div>

      {(validationError || error) && (
        <div className="alert alert-danger comment-form-error" role="alert">
          {validationError || error}
        </div>
      )}

      <textarea
        className={`form-textarea comment-textarea ${validationError ? 'input-error' : ''}`}
        rows={3}
        placeholder="Share your thoughts, ask questions, or provide feedback..."
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (validationError) setValidationError('');
        }}
        maxLength={1000}
        disabled={isLoading}
      />

      <div className="comment-form-footer">
        <button
          type="submit"
          className="btn btn-primary btn-sm comment-submit-btn"
          disabled={isLoading || !content.trim()}
        >
          {isLoading ? (
            <span className="spinner-wrap">
              <span className="btn-spinner"></span>
              Posting...
            </span>
          ) : (
            'Post Comment'
          )}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;

