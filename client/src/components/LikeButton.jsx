import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import postService from '../services/postService';

const LikeButton = ({
  postId,
  initialLikes = [],
  size = 'md',
  showLabel = true,
  onLikeChange = null
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Check if current user has already liked the post
  const checkIfLiked = (likesArr) => {
    if (!user || !Array.isArray(likesArr)) return false;
    return likesArr.some((item) => {
      const id = typeof item === 'string' ? item : item?._id;
      return id && id.toString() === user._id.toString();
    });
  };

  const [isLiked, setIsLiked] = useState(() => checkIfLiked(initialLikes));
  const [likesCount, setLikesCount] = useState(() =>
    Array.isArray(initialLikes) ? initialLikes.length : 0
  );
  const [loading, setLoading] = useState(false);
  const [promptLogin, setPromptLogin] = useState(false);

  useEffect(() => {
    setIsLiked(checkIfLiked(initialLikes));
    setLikesCount(Array.isArray(initialLikes) ? initialLikes.length : 0);
  }, [initialLikes, user]);

  const handleLikeClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // If guest, prompt to login
    if (!isAuthenticated) {
      setPromptLogin(true);
      setTimeout(() => setPromptLogin(false), 3500);
      return;
    }

    if (loading) return;

    // Optimistic state update
    const previousIsLiked = isLiked;
    const previousCount = likesCount;

    const newIsLiked = !previousIsLiked;
    const newCount = newIsLiked ? previousCount + 1 : Math.max(0, previousCount - 1);

    setIsLiked(newIsLiked);
    setLikesCount(newCount);
    setLoading(true);

    try {
      let res;
      if (previousIsLiked) {
        res = await postService.unlikePost(postId);
      } else {
        res = await postService.likePost(postId);
      }

      if (res.success && res.data) {
        setIsLiked(res.data.isLiked);
        setLikesCount(res.data.likesCount);
        if (onLikeChange) {
          onLikeChange(res.data.likesCount, res.data.isLiked);
        }
      } else {
        // Rollback on unexpected failure
        setIsLiked(previousIsLiked);
        setLikesCount(previousCount);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Rollback on error
      setIsLiked(previousIsLiked);
      setLikesCount(previousCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="like-button-wrapper">
      <button
        type="button"
        className={`like-btn like-btn-${size} ${isLiked ? 'liked' : 'unliked'} ${loading ? 'loading' : ''}`}
        onClick={handleLikeClick}
        aria-label={isLiked ? 'Unlike post' : 'Like post'}
        title={
          !isAuthenticated
            ? 'Sign in to like this post'
            : isLiked
            ? 'Unlike post'
            : 'Like post'
        }
      >
        <span className={`heart-icon ${isLiked ? 'pop' : ''}`}>
          {isLiked ? '❤️' : '🤍'}
        </span>
        <span className="like-count">{likesCount}</span>
        {showLabel && (
          <span className="like-label">
            {likesCount === 1 ? 'Like' : 'Likes'}
          </span>
        )}
      </button>

      {promptLogin && (
        <div className="guest-login-toast" onClick={(e) => e.stopPropagation()}>
          <span>Please sign in to like this post</span>
          <button
            type="button"
            className="btn btn-xs btn-primary"
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>
        </div>
      )}
    </div>
  );
};

export default LikeButton;

