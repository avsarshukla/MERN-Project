import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import postService from '../services/postService';
import PostForm from '../components/PostForm';

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    const fetchPostToEdit = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await postService.getPostById(id);
        if (res.success && res.data?.post) {
          const post = res.data.post;

          // Verify ownership: user must be the author or an admin
          const authorId = post.author?._id || post.author;
          if (user && user._id !== authorId && user.role !== 'admin') {
            setFetchError('Access denied: You are not authorized to edit this post.');
            return;
          }

          setInitialData({
            title: post.title,
            content: post.content,
            category: post.category || 'General',
            image: post.image || ''
          });
        } else {
          setFetchError(res.message || 'Post not found');
        }
      } catch (err) {
        console.error('Error fetching post for editing:', err);
        setFetchError(
          err.response?.data?.message || err.message || 'Failed to load post data'
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPostToEdit();
    }
  }, [id, user]);

  const handleUpdatePost = async (formData) => {
    setUpdating(true);
    setUpdateError(null);
    try {
      const res = await postService.updatePost(id, formData);
      if (res.success && res.data?.post) {
        setSuccessMsg('Post updated successfully!');
        setTimeout(() => {
          navigate(`/posts/${id}`);
        }, 600);
      } else {
        setUpdateError(res.message || 'Failed to update post');
      }
    } catch (err) {
      console.error('Error updating post:', err);
      setUpdateError(
        err.response?.data?.message ||
          err.message ||
          'Failed to update post. Please check your changes.'
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="post-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading post for editing...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="post-detail-error-container">
        <div className="alert alert-danger">
          <h3>Cannot Edit Post</h3>
          <p>{fetchError}</p>
        </div>
        <Link to={`/posts/${id}`} className="btn btn-outline">
          &larr; Back to Post
        </Link>
      </div>
    );
  }

  return (
    <div className="form-page-container">
      <div className="form-page-header">
        <Link to={`/posts/${id}`} className="breadcrumb-link">
          &larr; Back to Post
        </Link>
        <h1 className="form-page-title">
          Edit <span className="gradient-text">Post</span>
        </h1>
        <p className="form-page-subtitle">
          Update the title, category, cover image, or content of your post.
        </p>
      </div>

      <div className="card form-card">
        {successMsg && (
          <div className="alert alert-success" role="alert">
            {successMsg}
          </div>
        )}

        {initialData && (
          <PostForm
            initialValues={initialData}
            onSubmit={handleUpdatePost}
            isEditing={true}
            isLoading={updating}
            serverError={updateError}
          />
        )}
      </div>
    </div>
  );
};

export default EditPost;

