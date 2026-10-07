const User = require('../models/User');

/**
 * @desc    Get current user's profile
 * @route   GET /api/users/profile
 * @access  Private (Logged-in)
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error(`[GetUserProfile Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving profile'
    });
  }
};

/**
 * @desc    Update current user's profile
 * @route   PUT /api/users/profile
 * @access  Private (Logged-in)
 */
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update name if supplied
    if (req.body.name !== undefined) {
      const trimmedName = req.body.name.trim();
      if (trimmedName.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters long'
        });
      }
      user.name = trimmedName;
    }

    // Update email if supplied and different
    if (req.body.email !== undefined) {
      const normalizedEmail = req.body.email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const emailExists = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: user._id }
        });

        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Email is already in use by another account'
          });
        }
        user.email = normalizedEmail;
      }
    }

    // Update profileImage if supplied
    if (req.body.profileImage !== undefined) {
      user.profileImage = req.body.profileImage;
    }

    // Update password if supplied
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser.toSafeObject()
      }
    });
  } catch (error) {
    console.error(`[UpdateUserProfile Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile'
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile
};
