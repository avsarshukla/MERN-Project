import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">📝</span>
          <span className="logo-text">PostHub</span>
          <span className="badge-member">Member 1: Auth</span>
        </Link>

        <nav className="navbar-links">
          <Link to="/" className="nav-link">
            Home
          </Link>

          {isAuthenticated ? (
            <div className="user-nav-group">
              <Link to="/profile" className="profile-link">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="avatar-sm"
                  />
                ) : (
                  <div className="avatar-placeholder-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="user-name">{user?.name}</span>
                <span className={`role-badge role-${user?.role || 'user'}`}>
                  {user?.role}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-outline-danger btn-sm"
                id="logout-button"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost" id="nav-login-link">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" id="nav-register-link">
                Create Account
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
