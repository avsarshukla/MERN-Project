import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import dashboardService from '../services/dashboardService';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getUserDashboardStats();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
      setError(
        err.response?.data?.message || err.message || 'Could not load your dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div className="loading-spinner"></div>
        <p>Gathering your activity statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger dashboard-error-banner">
        <p>{error}</p>
        <button onClick={fetchStats} className="btn btn-sm btn-outline">
          Retry
        </button>
      </div>
    );
  }

  const stats = data?.stats || {
    userPostsCount: 0,
    totalLikesReceived: 0,
    userCommentsCount: 0,
    totalCommentsReceived: 0,
    globalPostsCount: 0,
    globalUsersCount: 0
  };

  const recentPosts = data?.recentPosts || [];
  const recentComments = data?.recentComments || [];

  return (
    <div className="dashboard-container">
      {/* Header Banner */}
      <header className="dashboard-header">
        <div className="dashboard-header-text">
          <h1 className="dashboard-title">
            Personal <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="dashboard-subtitle">
            Welcome back, <strong>{user?.name}</strong>. Here is a real-time summary of your content and community interactions.
          </p>
        </div>
        <div className="dashboard-header-badge">
          <span className={`role-badge role-${user?.role || 'user'}`}>
            {user?.role === 'admin' ? '🛡️ Administrator' : '👤 Community Author'}
          </span>
        </div>
      </header>

      {/* Metrics Grid */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon">📝</div>
          <div className="stat-card-info">
            <span className="stat-number">{stats.userPostsCount}</span>
            <span className="stat-label">Your Posts</span>
          </div>
          <Link to="/my-posts" className="stat-card-link">
            Manage &rarr;
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">❤️</div>
          <div className="stat-card-info">
            <span className="stat-number">{stats.totalLikesReceived}</span>
            <span className="stat-label">Likes Received</span>
          </div>
          <span className="stat-subtext">Across your articles</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">💬</div>
          <div className="stat-card-info">
            <span className="stat-number">{stats.userCommentsCount}</span>
            <span className="stat-label">Comments Written</span>
          </div>
          <span className="stat-subtext">Community discussions</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">📥</div>
          <div className="stat-card-info">
            <span className="stat-number">{stats.totalCommentsReceived}</span>
            <span className="stat-label">Comments Received</span>
          </div>
          <span className="stat-subtext">Reader engagement</span>
        </div>
      </section>

      {/* Quick Actions Bar */}
      <section className="dashboard-quick-actions">
        <Link to="/posts/create" className="btn btn-primary">
          ✍️ Write New Post
        </Link>
        <Link to="/my-posts" className="btn btn-outline">
          📂 View My Posts
        </Link>
        <Link to="/profile" className="btn btn-outline">
          👤 Edit Profile
        </Link>
        <Link to="/" className="btn btn-ghost">
          🌐 Explore All Posts
        </Link>
        {user?.role === 'admin' && (
          <Link to="/admin" className="btn btn-secondary admin-shortcut-btn">
            🛡️ Admin Control Panel
          </Link>
        )}
      </section>

      {/* Platform Scale Summary */}
      <section className="platform-summary-strip">
        <span>
          🌐 Platform Scale: <strong>{stats.globalPostsCount}</strong> published articles across{' '}
          <strong>{stats.globalUsersCount}</strong> registered creators.
        </span>
      </section>

      {/* Activity Streams Two-Column Grid */}
      <div className="dashboard-activity-grid">
        {/* Recent Posts Column */}
        <section className="activity-card">
          <div className="activity-card-header">
            <h3>Your Recent Posts</h3>
            <Link to="/my-posts" className="activity-view-all">
              View All &rarr;
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <div className="activity-empty-state">
              <span className="empty-icon">📝</span>
              <p>You haven't published any posts yet.</p>
              <Link to="/posts/create" className="btn btn-xs btn-primary">
                Write First Post
              </Link>
            </div>
          ) : (
            <div className="activity-list">
              {recentPosts.map((post) => (
                <div key={post._id} className="activity-item">
                  <div className="activity-item-main">
                    <span className="post-category-tag">{post.category || 'General'}</span>
                    <Link to={`/posts/${post._id}`} className="activity-item-title">
                      {post.title}
                    </Link>
                    <div className="activity-item-meta">
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>❤️ {post.likes?.length || 0}</span>
                    </div>
                  </div>
                  <Link
                    to={`/posts/${post._id}/edit`}
                    className="btn btn-xs btn-outline"
                    title="Edit post"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Comments Column */}
        <section className="activity-card">
          <div className="activity-card-header">
            <h3>Your Recent Comments</h3>
          </div>

          {recentComments.length === 0 ? (
            <div className="activity-empty-state">
              <span className="empty-icon">💬</span>
              <p>You haven't participated in any discussions yet.</p>
              <Link to="/" className="btn btn-xs btn-outline">
                Browse Feed
              </Link>
            </div>
          ) : (
            <div className="activity-list">
              {recentComments.map((comment) => (
                <div key={comment._id} className="activity-item">
                  <div className="activity-item-main">
                    <p className="activity-comment-preview">"{comment.content}"</p>
                    <div className="activity-item-meta">
                      {comment.post ? (
                        <span>
                          on <Link to={`/posts/${comment.post._id}`}>{comment.post.title}</Link>
                        </span>
                      ) : (
                        <span className="text-muted">(Post deleted)</span>
                      )}
                      <span>•</span>
                      <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;

