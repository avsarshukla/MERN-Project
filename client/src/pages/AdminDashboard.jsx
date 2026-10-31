import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import adminService from '../services/adminService';
import ConfirmationModal from '../components/ConfirmationModal';
import Pagination from '../components/Pagination';

const AdminDashboard = () => {
  const { user } = useAuth();

  // Active tab state: 'overview' | 'users' | 'posts' | 'comments'
  const [activeTab, setActiveTab] = useState('overview');

  // Stats state
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Users management state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);

  // Posts moderation state
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postSearch, setPostSearch] = useState('');
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotalPages, setPostsTotalPages] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);

  // Comments moderation state
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSearch, setCommentSearch] = useState('');
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotalPages, setCommentsTotalPages] = useState(1);
  const [commentsTotal, setCommentsTotal] = useState(0);

  // Modals state
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'user'|'post'|'comment', item: ... }
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: 'success' });

  const showFeedback = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg({ text: '', type: 'success' }), 4000);
  };

  // 1. Fetch overview statistics
  const fetchOverview = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await adminService.getAdminStats();
      if (res.success && res.data) {
        setStatsData(res.data);
      } else {
        setStatsError(res.message || 'Failed to load admin stats');
      }
    } catch (err) {
      console.error('Error fetching admin statistics:', err);
      setStatsError(err.response?.data?.message || err.message || 'Error loading stats');
    } finally {
      setStatsLoading(false);
    }
  };

  // 2. Fetch users list
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = {
        page: usersPage,
        limit: 10,
        search: userSearch.trim() || undefined,
        role: userRoleFilter || undefined
      };
      const res = await adminService.getAdminUsers(params);
      if (res.success) {
        setUsers(res.data || []);
        setUsersTotalPages(res.totalPages || 1);
        setUsersTotal(res.total || 0);
      }
    } catch (err) {
      console.error('Error fetching users for admin:', err);
      showFeedback('Failed to load users', 'danger');
    } finally {
      setUsersLoading(false);
    }
  };

  // 3. Fetch posts list
  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const params = {
        page: postsPage,
        limit: 10,
        search: postSearch.trim() || undefined
      };
      const res = await adminService.getAdminPosts(params);
      if (res.success) {
        setPosts(res.data || []);
        setPostsTotalPages(res.totalPages || 1);
        setPostsTotal(res.total || 0);
      }
    } catch (err) {
      console.error('Error fetching posts for admin:', err);
      showFeedback('Failed to load posts', 'danger');
    } finally {
      setPostsLoading(false);
    }
  };

  // 4. Fetch comments list
  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const params = {
        page: commentsPage,
        limit: 10,
        search: commentSearch.trim() || undefined
      };
      const res = await adminService.getAdminComments(params);
      if (res.success) {
        setComments(res.data || []);
        setCommentsTotalPages(res.totalPages || 1);
        setCommentsTotal(res.total || 0);
      }
    } catch (err) {
      console.error('Error fetching comments for admin:', err);
      showFeedback('Failed to load comments', 'danger');
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, usersPage, userRoleFilter]);

  useEffect(() => {
    if (activeTab === 'posts') fetchPosts();
  }, [activeTab, postsPage]);

  useEffect(() => {
    if (activeTab === 'comments') fetchComments();
  }, [activeTab, commentsPage]);

  // Handle Role Change
  const handleRoleToggle = async (targetUser) => {
    if (targetUser._id === user._id) {
      showFeedback('You cannot revoke your own administrator privileges.', 'danger');
      return;
    }

    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await adminService.updateAdminUserRole(targetUser._id, newRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === targetUser._id ? { ...u, role: newRole } : u))
        );
        showFeedback(`Role for ${targetUser.name} updated to ${newRole}`);
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to update user role', 'danger');
    }
  };

  // Handle Deletion Confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    const { type, item } = deleteTarget;

    try {
      if (type === 'user') {
        const res = await adminService.deleteAdminUser(item._id);
        if (res.success) {
          setUsers((prev) => prev.filter((u) => u._id !== item._id));
          setUsersTotal((prev) => Math.max(0, prev - 1));
          showFeedback(`User ${item.name} and all associated content deleted.`);
        }
      } else if (type === 'post') {
        const res = await adminService.deleteAdminPost(item._id);
        if (res.success) {
          setPosts((prev) => prev.filter((p) => p._id !== item._id));
          setPostsTotal((prev) => Math.max(0, prev - 1));
          showFeedback(`Post "${item.title}" moderated and deleted.`);
        }
      } else if (type === 'comment') {
        const res = await adminService.deleteAdminComment(item._id);
        if (res.success) {
          setComments((prev) => prev.filter((c) => c._id !== item._id));
          setCommentsTotal((prev) => Math.max(0, prev - 1));
          showFeedback('Comment moderated and deleted.');
        }
      }
      setDeleteTarget(null);
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to delete resource', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const stats = statsData?.stats || {
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalLikes: 0,
    adminCount: 0,
    regularUserCount: 0
  };

  return (
    <div className="admin-container">
      {/* Admin Header */}
      <header className="admin-header">
        <div>
          <h1 className="admin-title">
            🛡️ Administrator <span className="gradient-text">Control Panel</span>
          </h1>
          <p className="admin-subtitle">
            System moderation, user access management, and global platform analytics.
          </p>
        </div>
        <div className="admin-header-actions">
          <Link to="/dashboard" className="btn btn-outline btn-sm">
            &larr; User Dashboard
          </Link>
        </div>
      </header>

      {/* Global Feedback Banner */}
      {feedbackMsg.text && (
        <div className={`alert alert-${feedbackMsg.type} admin-toast`}>
          {feedbackMsg.text}
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <nav className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 System Overview
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Manage Users ({usersTotal || stats.totalUsers})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          📝 Manage Posts ({postsTotal || stats.totalPosts})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          💬 Manage Comments ({commentsTotal || stats.totalComments})
        </button>
      </nav>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="admin-tab-content">
          {statsLoading ? (
            <div className="feed-loading-state">
              <div className="loading-spinner"></div>
              <p>Gathering system statistics...</p>
            </div>
          ) : statsError ? (
            <div className="alert alert-danger">
              <p>{statsError}</p>
              <button onClick={fetchOverview} className="btn btn-sm btn-outline">
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-icon">👥</div>
                  <div className="stat-card-info">
                    <span className="stat-number">{stats.totalUsers}</span>
                    <span className="stat-label">Total Users</span>
                  </div>
                  <span className="stat-subtext">
                    {stats.adminCount} Admins • {stats.regularUserCount} Users
                  </span>
                </div>

                <div className="stat-card">
                  <div className="stat-card-icon">📝</div>
                  <div className="stat-card-info">
                    <span className="stat-number">{stats.totalPosts}</span>
                    <span className="stat-label">Published Posts</span>
                  </div>
                  <span className="stat-subtext">Platform articles</span>
                </div>

                <div className="stat-card">
                  <div className="stat-card-icon">💬</div>
                  <div className="stat-card-info">
                    <span className="stat-number">{stats.totalComments}</span>
                    <span className="stat-label">Comments</span>
                  </div>
                  <span className="stat-subtext">Discussion items</span>
                </div>

                <div className="stat-card">
                  <div className="stat-card-icon">❤️</div>
                  <div className="stat-card-info">
                    <span className="stat-number">{stats.totalLikes}</span>
                    <span className="stat-label">Total Likes</span>
                  </div>
                  <span className="stat-subtext">Global post likes</span>
                </div>
              </div>

              {/* Categories & Recent Activities */}
              <div className="admin-overview-grid">
                <div className="card admin-overview-card">
                  <h3>Posts by Category</h3>
                  <div className="category-pills-list">
                    {statsData?.categoriesCount?.map((cat) => (
                      <div key={cat._id || 'General'} className="category-pill-item">
                        <span className="category-name">{cat._id || 'General'}</span>
                        <span className="category-count-badge">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card admin-overview-card">
                  <h3>Recent Users</h3>
                  <ul className="admin-recent-list">
                    {statsData?.recentUsers?.map((u) => (
                      <li key={u._id} className="admin-recent-item">
                        <span className="user-name">{u.name}</span>
                        <span className="user-email text-muted">({u.email})</span>
                        <span className={`role-badge role-${u.role}`}>{u.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: MANAGE USERS */}
      {activeTab === 'users' && (
        <div className="admin-tab-content">
          <div className="admin-table-toolbar">
            <form
              className="search-form"
              onSubmit={(e) => {
                e.preventDefault();
                setUsersPage(1);
                fetchUsers();
              }}
            >
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-sm">
                Search
              </button>
            </form>

            <div className="filter-item">
              <label className="filter-label">Role:</label>
              <select
                className="filter-select"
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setUsersPage(1);
                }}
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="admin-table-container">
            {usersLoading ? (
              <div className="feed-loading-state">
                <div className="loading-spinner"></div>
                <p>Loading user list...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="empty-state-card">
                <p>No users found matching your query.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td className="user-cell">
                        <div className="avatar-placeholder-xs">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-weight-bold">{u.name}</span>
                        {u._id === user._id && <span className="text-muted">(You)</span>}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge role-${u.role}`}>{u.role}</span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="admin-row-actions">
                          {u._id !== user._id && (
                            <>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline"
                                onClick={() => handleRoleToggle(u)}
                                title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                              >
                                {u.role === 'admin' ? 'Demote' : 'Promote'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-danger"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'user',
                                    item: u,
                                    title: 'Delete User Account',
                                    message: `Are you sure you want to delete user "${u.name}" (${u.email})? All posts, comments, and interactions created by this user will be permanently removed.`
                                  })
                                }
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Pagination
            currentPage={usersPage}
            totalPages={usersTotalPages}
            totalItems={usersTotal}
            onPageChange={(p) => setUsersPage(p)}
          />
        </div>
      )}

      {/* TAB 3: MANAGE POSTS */}
      {activeTab === 'posts' && (
        <div className="admin-tab-content">
          <div className="admin-table-toolbar">
            <form
              className="search-form"
              onSubmit={(e) => {
                e.preventDefault();
                setPostsPage(1);
                fetchPosts();
              }}
            >
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search posts by title or content..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-sm">
                Search
              </button>
            </form>
          </div>

          <div className="admin-table-container">
            {postsLoading ? (
              <div className="feed-loading-state">
                <div className="loading-spinner"></div>
                <p>Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="empty-state-card">
                <p>No posts found matching your query.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th>Stats</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p._id}>
                      <td className="post-title-cell">
                        <Link to={`/posts/${p._id}`} className="admin-post-link">
                          {p.title}
                        </Link>
                      </td>
                      <td>{p.author?.name || 'Unknown'}</td>
                      <td>
                        <span className="post-category-tag">{p.category || 'General'}</span>
                      </td>
                      <td>
                        <span className="stat-pill">❤️ {p.likes?.length || 0}</span>
                      </td>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="admin-row-actions">
                          <Link to={`/posts/${p._id}`} className="btn btn-xs btn-outline">
                            View
                          </Link>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-danger"
                            onClick={() =>
                              setDeleteTarget({
                                type: 'post',
                                item: p,
                                title: 'Moderate Post',
                                message: `Are you sure you want to remove post "${p.title}"? All comments on this post will also be deleted.`
                              })
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Pagination
            currentPage={postsPage}
            totalPages={postsTotalPages}
            totalItems={postsTotal}
            onPageChange={(p) => setPostsPage(p)}
          />
        </div>
      )}

      {/* TAB 4: MANAGE COMMENTS */}
      {activeTab === 'comments' && (
        <div className="admin-tab-content">
          <div className="admin-table-toolbar">
            <form
              className="search-form"
              onSubmit={(e) => {
                e.preventDefault();
                setCommentsPage(1);
                fetchComments();
              }}
            >
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search comments by text..."
                  value={commentSearch}
                  onChange={(e) => setCommentSearch(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-sm">
                Search
              </button>
            </form>
          </div>

          <div className="admin-table-container">
            {commentsLoading ? (
              <div className="feed-loading-state">
                <div className="loading-spinner"></div>
                <p>Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="empty-state-card">
                <p>No comments found matching your query.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Comment</th>
                    <th>Author</th>
                    <th>Post</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {comments.map((c) => (
                    <tr key={c._id}>
                      <td className="comment-content-cell">
                        <span className="admin-comment-snippet">"{c.content}"</span>
                      </td>
                      <td>{c.author?.name || 'Unknown'}</td>
                      <td>
                        {c.post ? (
                          <Link to={`/posts/${c.post._id}`} className="admin-post-link">
                            {c.post.title}
                          </Link>
                        ) : (
                          <span className="text-muted">(Deleted Post)</span>
                        )}
                      </td>
                      <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-danger"
                            onClick={() =>
                              setDeleteTarget({
                                type: 'comment',
                                item: c,
                                title: 'Moderate Comment',
                                message: `Are you sure you want to permanently delete this comment by ${c.author?.name || 'author'}?`
                              })
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Pagination
            currentPage={commentsPage}
            totalPages={commentsTotalPages}
            totalItems={commentsTotal}
            onPageChange={(p) => setCommentsPage(p)}
          />
        </div>
      )}

      {/* Reusable Destructive Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.title || 'Confirm Moderation'}
        message={deleteTarget?.message || 'Are you sure you want to delete this resource?'}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={actionLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminDashboard;

