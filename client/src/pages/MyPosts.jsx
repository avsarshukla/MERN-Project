import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import postService from '../services/postService';
import PostCard from '../components/PostCard';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';

const MyPosts = () => {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  // Delete modal state
  const [postToDelete, setPostToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchMyPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 9,
        search: search.trim() || undefined
      };
      const res = await postService.getMyPosts(params);
      if (res.success) {
        setPosts(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalPosts(res.total || 0);
      } else {
        setError(res.message || 'Failed to fetch your posts');
      }
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setError(err.response?.data?.message || err.message || 'Error loading your posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
  }, [currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMyPosts();
  };

  const handleDeleteClick = (post) => {
    setPostToDelete(post);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await postService.deletePost(postToDelete._id);
      if (res.success) {
        setPosts((prev) => prev.filter((p) => p._id !== postToDelete._id));
        setTotalPosts((prev) => Math.max(0, prev - 1));
        setPostToDelete(null);
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

  return (
    <div className="my-posts-container">
      <header className="page-header-row">
        <div>
          <h1 className="page-title">
            My <span className="gradient-text">Posts</span>
          </h1>
          <p className="page-subtitle">
            Manage your personal articles, edit published stories, or draft new ideas.
          </p>
        </div>
        <Link to="/posts/create" className="btn btn-primary">
          ✍️ Create New Post
        </Link>
      </header>

      {/* Search Bar */}
      <section className="feed-toolbar">
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search through your posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearch('');
                  setCurrentPage(1);
                }}
              >
                &times;
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-secondary search-submit-btn">
            Filter
          </button>
        </form>
      </section>

      {/* Posts Section */}
      <section className="my-posts-list-section">
        {loading ? (
          <div className="feed-loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your posts...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">
            <p>{error}</p>
            <button onClick={fetchMyPosts} className="btn btn-sm btn-outline">
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">✍️</div>
            <h3>No posts yet</h3>
            <p>
              {search
                ? 'No posts matched your search. Try a different search term.'
                : "You haven't written any posts yet. Share your thoughts with the community today!"}
            </p>
            <Link to="/posts/create" className="btn btn-primary">
              Write Your First Post
            </Link>
          </div>
        ) : (
          <>
            <div className="feed-header-info">
              <span className="post-count-badge">
                {totalPosts} {totalPosts === 1 ? 'published post' : 'published posts'}
              </span>
            </div>

            <div className="posts-grid">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  showActions={true}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalPosts}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!postToDelete}
        title="Delete Post"
        message={`Are you sure you want to permanently delete "${postToDelete?.title}"? This cannot be undone.`}
        confirmText="Delete Post"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setPostToDelete(null);
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

export default MyPosts;

