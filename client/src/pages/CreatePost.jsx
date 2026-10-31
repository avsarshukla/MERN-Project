import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import postService from '../services/postService';
import PostForm from '../components/PostForm';

const CreatePost = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleCreatePost = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await postService.createPost(formData);
      if (res.success && res.data?.post) {
        setSuccessMsg('Post published successfully!');
        setTimeout(() => {
          navigate(`/posts/${res.data.post._id}`);
        }, 600);
      } else {
        setError(res.message || 'Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to publish post. Please check your input.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page-container">
      <div className="form-page-header">
        <Link to="/" className="breadcrumb-link">
          &larr; Back to Feed
        </Link>
        <h1 className="form-page-title">
          Create <span className="gradient-text">New Post</span>
        </h1>
        <p className="form-page-subtitle">
          Share your knowledge, tutorials, opinions, or stories with the community.
        </p>
      </div>

      <div className="card form-card">
        {successMsg && (
          <div className="alert alert-success" role="alert">
            {successMsg}
          </div>
        )}

        <PostForm
          onSubmit={handleCreatePost}
          isEditing={false}
          isLoading={loading}
          serverError={error}
        />
      </div>
    </div>
  );
};

export default CreatePost;

