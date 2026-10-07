import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';

const Profile = () => {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profileImage: '',
    password: '',
    confirmPassword: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        profileImage: user.profileImage || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Name cannot be empty');
      return;
    }

    if (formData.password) {
      if (formData.password.length < 6) {
        setErrorMessage('New password must be at least 6 characters long');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage('New passwords do not match');
        return;
      }
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      profileImage: formData.profileImage.trim()
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    setSubmitting(true);
    const result = await updateProfile(payload);
    setSubmitting(false);

    if (result.success) {
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      setFormData((prev) => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    } else {
      setErrorMessage(result.message || 'Failed to update profile');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-grid">
        {/* Profile Overview Card */}
        <div className="card profile-overview-card">
          <div className="profile-avatar-wrapper">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="profile-avatar-img"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h2 className="profile-name">{user?.name}</h2>
          <p className="profile-email">{user?.email}</p>
          <div className="profile-meta">
            <span className={`role-badge role-${user?.role || 'user'}`}>
              Role: {user?.role}
            </span>
          </div>

          <div className="profile-details-list">
            <div className="profile-detail-item">
              <span className="detail-label">User ID:</span>
              <span className="detail-value code-font">{user?._id}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Joined:</span>
              <span className="detail-value">{formatDate(user?.createdAt)}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Last Updated:</span>
              <span className="detail-value">{formatDate(user?.updatedAt)}</span>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn btn-outline btn-block mt-4"
            id="toggle-edit-btn"
          >
            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile Edit / Information Card */}
        <div className="card profile-edit-card">
          <div className="card-header">
            <h3>{isEditing ? 'Update Profile Details' : 'Account Overview'}</h3>
            <p className="text-muted">
              {isEditing
                ? 'Update your personal info, avatar URL, or change your password.'
                : 'Your identity and credentials are secure in accordance with Member 1 specifications.'}
            </p>
          </div>

          {successMessage && (
            <div className="alert alert-success" role="alert">
              <span className="alert-icon">✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              <span className="alert-icon">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="edit-name">Display Name</label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-email">Email Address</label>
                <input
                  type="email"
                  id="edit-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-image">Profile Image URL (Optional)</label>
                <input
                  type="url"
                  id="edit-image"
                  name="profileImage"
                  value={formData.profileImage}
                  onChange={handleChange}
                  placeholder="https://example.com/photo.jpg"
                  className="form-control"
                />
              </div>

              <hr className="divider" />
              <h4 className="section-title">Change Password (Leave blank to keep current)</h4>

              <div className="form-group">
                <label htmlFor="edit-password">New Password</label>
                <input
                  type="password"
                  id="edit-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-confirm-password">Confirm New Password</label>
                <input
                  type="password"
                  id="edit-confirm-password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className="form-control"
                />
              </div>

              <div className="form-actions-row">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  id="save-profile-btn"
                >
                  {submitting ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="security-info-box">
              <div className="info-badge-row">
                <div className="info-card">
                  <div className="info-icon">🔒</div>
                  <h4>Password Protected</h4>
                  <p>Hashed with bcrypt. Never exposed over API or stored plaintext.</p>
                </div>
                <div className="info-card">
                  <div className="info-icon">🛡️</div>
                  <h4>JWT Session</h4>
                  <p>Authenticated requests protected via Bearer token middleware.</p>
                </div>
                <div className="info-card">
                  <div className="info-icon">👤</div>
                  <h4>Scoped Access</h4>
                  <p>Users can only view and update their own authorized profile.</p>
                </div>
              </div>

              <div className="next-steps-banner">
                <h4>Ready for Team Integration</h4>
                <p>
                  Member 1's Authentication & User Management module is fully wired.
                  Member 2 (Posts), Member 3 (Comments & Likes), and Member 4 (Admin Dashboard)
                  can directly consume <code>AuthContext</code> and <code>/api/auth/me</code>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
