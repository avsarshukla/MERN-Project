import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';

const CommentItem = ({
  comment,
  onUpdate,
  onDelete
}) => {
  const { user } = useAuth();

  const authorId = comment.author?._id || comment.author;
  const isAuthor = user && user._id === authorId;
  const isAdmin = user && user.role === 'admin';
  const canModify = isAuthor || isAdmin;

  const authorName = comment.author?.name || 'Anonymous';
  const authorImage = comment.author?.profileImage;
  const authorRole = comment.author?.role || 'user';

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [editError, setEditError] = useState('');

  // Format date
  const formattedDate = new Date(comment.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const isEdited =
    comment.updatedAt &&
    new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 1000;

  const handleSaveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) {
      setEditError('Comment cannot be empty.');
      return;
    }
    if (trimmed.length > 1000) {
      setEditError('Comment cannot exceed 1000 characters.');
      return;
    }

    setIsSaving(true);
    setEditError('');
    try {
      await onUpdate(comment._id, trimmed);
      setIsEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || 'Failed to update comment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(comment._id);
    } catch (err) {
      console.error('Delete comment error:', err);
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <article className="comment-item">
      <div className="comment-header">
        <div className="comment-author-meta">
          {authorImage ? (
            <img
              src={authorImage}
              alt={authorName}
              className="avatar-xs"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="avatar-placeholder-xs">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="comment-author-name">{authorName}</span>
          {authorRole === 'admin' && (
            <span className="role-badge role-admin comment-role">Admin</span>
          )}
          <time className="comment-timestamp" dateTime={comment.createdAt}>
            {formattedDate}
          </time>
          {isEdited && <span className="comment-edited-tag">(edited)</span>}
        </div>

        {canModify && !isEditing && (
          <div className="comment-actions">
            <button
              type="button"
              className="comment-action-btn edit-btn"
              onClick={() => {
                setIsEditing(true);
                setEditContent(comment.content);
                setEditError('');
              }}
              title="Edit comment"
            >
              Edit
            </button>
            <button
              type="button"
              className="comment-action-btn delete-btn"
              onClick={() => setShowConfirmDelete(true)}
              title="Delete comment"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="comment-edit-box">
          {editError && (
            <div className="alert alert-danger comment-edit-error">
              {editError}
            </div>
          )}
          <textarea
            className="form-textarea comment-textarea"
            rows={3}
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value);
              if (editError) setEditError('');
            }}
            maxLength={1000}
            disabled={isSaving}
          />
          <div className="comment-edit-footer">
            <span className="comment-char-counter">{editContent.length}/1000</span>
            <div className="comment-edit-actions">
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                  setEditError('');
                }}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-xs btn-primary"
                onClick={handleSaveEdit}
                disabled={isSaving || !editContent.trim()}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="comment-body">
          <p>{comment.content}</p>
        </div>
      )}

      {showConfirmDelete && (
        <div className="comment-delete-confirm">
          <span>Delete this comment?</span>
          <button
            type="button"
            className="btn btn-xs btn-outline-danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
          <button
            type="button"
            className="btn btn-xs btn-outline"
            onClick={() => setShowConfirmDelete(false)}
            disabled={isDeleting}
          >
            Cancel
          </button>
        </div>
      )}
    </article>
  );
};

export default CommentItem;

