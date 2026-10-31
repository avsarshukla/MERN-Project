import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import postService from '../services/postService';
import PostCard from '../components/PostCard';
import Pagination from '../components/Pagination';

const CATEGORIES = [
  'All',
  'General',
  'Technology',
  'Lifestyle',
  'Education',
  'Business',
  'Science',
  'Design',
  'Health'
];

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state synchronization for bookmarkable searches & pagination
  const initialPage = parseInt(searchParams.get('page'), 10) || 1;
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialSort = searchParams.get('sort') || 'newest';

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 9,
        search: searchParams.get('search') || undefined,
        category: searchParams.get('category') !== 'All' ? searchParams.get('category') : undefined,
        sort: searchParams.get('sort') || undefined
      };

      const res = await postService.getPosts(params);
      if (res.success) {
        setPosts(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalPosts(res.total || 0);
      } else {
        setError(res.message || 'Failed to fetch posts');
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.response?.data?.message || err.message || 'Could not load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [searchParams]);

  // Update search params
  const updateFilters = (newPage, newSearch, newCategory, newSort) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set('page', newPage.toString());
    if (newSearch && newSearch.trim()) params.set('search', newSearch.trim());
    if (newCategory && newCategory !== 'All') params.set('category', newCategory);
    if (newSort && newSort !== 'newest') params.set('sort', newSort);
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    updateFilters(1, searchInput, selectedCategory, selectedSort);
  };

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setSelectedCategory(cat);
    setCurrentPage(1);
    updateFilters(1, searchInput, cat, selectedSort);
  };

  const handleSortChange = (e) => {
    const sort = e.target.value;
    setSelectedSort(sort);
    setCurrentPage(1);
    updateFilters(1, searchInput, selectedCategory, sort);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSelectedCategory('All');
    setSelectedSort('newest');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    updateFilters(page, searchInput, selectedCategory, selectedSort);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <div className="home-container">
      {/* Dynamic Hero Section */}
      <section className="hero-section">
        {isAuthenticated ? (
          <div className="hero-auth-content">
            <h1 className="hero-title">
              Welcome back, <span className="gradient-text">{user?.name}</span>!
            </h1>
            <p className="hero-subtitle">
              Explore the latest thoughts, articles, and discussions from the community, or share your own ideas with the world.
            </p>
            <div className="hero-actions-row">
              <Link to="/posts/create" className="btn btn-primary" id="hero-create-btn">
                ✍️ Create New Post
              </Link>
              <Link to="/my-posts" className="btn btn-outline" id="hero-my-posts-btn">
                📂 View My Posts
              </Link>
            </div>
          </div>
        ) : (
          <div className="hero-guest-content">
            <h1 className="hero-title">
              Share Your Thoughts with <span className="gradient-text">PostHub</span>
            </h1>
            <p className="hero-subtitle">
              A modern, full-stack community platform to write, discover, and discuss interesting ideas.
            </p>
            <div className="hero-actions-row">
              <Link to="/register" className="btn btn-primary" id="hero-register-btn">
                Get Started — Create Account
              </Link>
              <Link to="/login" className="btn btn-outline" id="hero-login-btn">
                Sign In
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Search and Filters Toolbar */}
      <section className="feed-toolbar">
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search posts by title or content..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchInput('');
                  updateFilters(1, '', selectedCategory, selectedSort);
                }}
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-secondary search-submit-btn">
            Search
          </button>
        </form>

        <div className="filter-controls">
          <div className="filter-item">
            <label htmlFor="category-filter" className="filter-label">
              Category:
            </label>
            <select
              id="category-filter"
              className="filter-select"
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="sort-filter" className="filter-label">
              Sort By:
            </label>
            <select
              id="sort-filter"
              className="filter-select"
              value={selectedSort}
              onChange={handleSortChange}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title_asc">Title (A-Z)</option>
              <option value="title_desc">Title (Z-A)</option>
            </select>
          </div>

          {(searchInput || selectedCategory !== 'All' || selectedSort !== 'newest') && (
            <button
              type="button"
              className="btn btn-ghost btn-sm reset-filter-btn"
              onClick={handleClearFilters}
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Main Feed Section */}
      <section className="feed-section">
        {loading ? (
          <div className="feed-loading-state">
            <div className="loading-spinner"></div>
            <p>Loading posts...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger feed-error">
            <p>{error}</p>
            <button onClick={fetchPosts} className="btn btn-sm btn-outline">
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">📄</div>
            <h3>No posts found</h3>
            <p>
              {searchInput || selectedCategory !== 'All'
                ? 'No posts matched your current search or filter criteria. Try adjusting your search term.'
                : 'There are no published posts yet. Be the first one to share a post!'}
            </p>
            {isAuthenticated ? (
              <Link to="/posts/create" className="btn btn-primary">
                ✍️ Write First Post
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary">
                Sign in to Create Post
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="feed-header-info">
              <h2 className="feed-heading">
                {selectedCategory !== 'All' ? `${selectedCategory} Posts` : 'Latest Posts'}
              </h2>
              <span className="post-count-badge">
                {totalPosts} {totalPosts === 1 ? 'post' : 'posts'}
              </span>
            </div>

            <div className="posts-grid">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalPosts}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </section>
    </div>
  );
};

export default Home;
