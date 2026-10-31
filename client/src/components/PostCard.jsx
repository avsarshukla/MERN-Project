import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LikeButton from './LikeButton';

const PostCard = ({ post, onDelete, showActions = false }) => {
  const { user } = useAuth();

  const authorId = post.author?._id || post.author;
  const isOwner = user && (user._id === authorId || user.role === 'admin');
  const authorName = post.author?.name || 'Anonymous Author';
  const authorImage = post.author?.profileImage;

  // Format date
  const formattedDate = new Date(post.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Shorten preview text
  const previewText =
    post.content?.length > 140
      ? post.content.substring(0, 140).trim() + '...'
      : post.content;

  return (
    <article className="post-card">
      {post.image && (
        <div className="post-card-image-wrap">
          <img
            src={post.image}
            alt={post.title}
            className="post-card-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="post-card-body">
        <div className="post-card-meta-top">
          <span className="post-category-tag">{post.category || 'General'}</span>
          <time className="post-date" dateTime={post.createdAt}>
            {formattedDate}
          </time>
        </div>

        <h2 className="post-card-title">
          <Link to={`/posts/${post._id}`}>{post.title}</Link>
        </h2>

        <p className="post-card-preview">{previewText}</p>

        <div className="post-card-interactions-row">
          <LikeButton
            postId={post._id}
            initialLikes={post.likes || []}
            size="sm"
            showLabel={false}
          />
          <Link
            to={`/posts/${post._id}#comments`}
            className="card-comments-counter-link"
            title="Join discussion"
          >
            💬 Discuss
          </Link>
        </div>

        <div className="post-card-footer">
          <div className="post-author-info">
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
            <span className="author-name">{authorName}</span>
          </div>

          <div className="post-card-actions">
            {(showActions || isOwner) && (
              <div className="post-owner-buttons">
                <Link
                  to={`/posts/${post._id}/edit`}
                  className="btn btn-xs btn-outline"
                  title="Edit post"
                >
                  Edit
                </Link>
                {onDelete && (
                  <button
                    onClick={() => onDelete(post)}
                    className="btn btn-xs btn-outline-danger"
                    title="Delete post"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
            <Link to={`/posts/${post._id}`} className="read-more-link">
              Read &rarr;
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
