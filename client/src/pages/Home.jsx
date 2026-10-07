import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Home = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="badge-pill">MERN Group Project — Member 1 Active</div>
        <h1 className="hero-title">
          Post Management <span className="gradient-text">System</span>
        </h1>
        <p className="hero-subtitle">
          Robust, secure full-stack authentication and user profile management
          built strictly according to the project specification.
        </p>

        <div className="hero-actions">
          {isAuthenticated ? (
            <div className="hero-auth-box">
              <p>Welcome back, <strong>{user?.name}</strong>!</p>
              <div className="action-buttons-row">
                <Link to="/profile" className="btn btn-primary">
                  Manage Profile
                </Link>
              </div>
            </div>
          ) : (
            <div className="action-buttons-row">
              <Link to="/register" className="btn btn-primary" id="hero-register-btn">
                Register New User
              </Link>
              <Link to="/login" className="btn btn-outline" id="hero-login-btn">
                Sign In to Account
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="modules-grid">
        <div className="card module-card active">
          <div className="module-header">
            <span className="module-tag active-tag">Member 1 (Implemented)</span>
            <span className="status-indicator online"></span>
          </div>
          <h3>Authentication & User Management</h3>
          <p>
            JWT token generation, bcrypt password hashing, input validation,
            protected routes, user profile retrieval & updates, and role support.
          </p>
          <ul className="feature-list">
            <li>✓ MongoDB User Schema & Validation</li>
            <li>✓ Secure JWT Authentication Middleware</li>
            <li>✓ Profile Management & Data Protection</li>
          </ul>
        </div>

        <div className="card module-card pending">
          <div className="module-header">
            <span className="module-tag pending-tag">Member 2 (Pending)</span>
          </div>
          <h3>Post Management / Core CRUD</h3>
          <p>
            Post schema, author references, creating, editing, and deleting posts.
            Reserved for Member 2 integration.
          </p>
        </div>

        <div className="card module-card pending">
          <div className="module-header">
            <span className="module-tag pending-tag">Member 3 (Pending)</span>
          </div>
          <h3>Likes, Comments & Interactions</h3>
          <p>
            Social interactions, comment threads, and like tracking. Reserved
            for Member 3 integration.
          </p>
        </div>

        <div className="card module-card pending">
          <div className="module-header">
            <span className="module-tag pending-tag">Member 4 (Pending)</span>
          </div>
          <h3>Dashboard & Administration</h3>
          <p>
            User analytics, moderation, and role-based admin controls. Reserved
            for Member 4 integration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
