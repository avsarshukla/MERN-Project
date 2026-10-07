const jwt = require('jsonwebtoken');

/**
 * Generate a JSON Web Token (JWT) for an authenticated user.
 * Payload includes the user ID and role.
 *
 * @param {string} userId - MongoDB ObjectId of the user
 * @param {string} role - User role ('user' | 'admin')
 * @returns {string} Signed JWT token
 */
const generateToken = (userId, role = 'user') => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_for_development_post_management';
  const expiresIn = process.env.JWT_EXPIRE || '30d';

  return jwt.sign(
    { id: userId, role },
    secret,
    { expiresIn }
  );
};

module.exports = generateToken;
