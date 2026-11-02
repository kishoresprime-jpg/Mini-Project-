const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Department = require('../models/Department');
const { logAudit } = require('../middleware/audit');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      department: user.department?._id || user.department,
    },
    process.env.JWT_SECRET || 'dev_secret_fallback',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('department', 'name code');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact your institution administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    const userJson = user.toJSON();

    await logAudit({
      req: { ...req, user: userJson },
      action: 'USER_LOGIN',
      targetModel: 'User',
      targetId: user._id,
      description: `User ${user.email} (${user.role}) logged in successfully.`,
    });

    res.status(200).json({
      success: true,
      token,
      user: userJson,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('department', 'name code');
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/update-profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, designation, skills } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (designation !== undefined) user.designation = designation;
    if (skills && Array.isArray(skills)) user.skills = skills;

    await user.save();

    await logAudit({
      req,
      action: 'PROFILE_UPDATED',
      targetModel: 'User',
      targetId: user._id,
      description: `User ${user.email} updated profile details.`,
    });

    res.status(200).json({
      success: true,
      user: user.toJSON(),
      message: 'Profile updated successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are both required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'The current password provided is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    await logAudit({
      req,
      action: 'PASSWORD_CHANGED',
      targetModel: 'User',
      targetId: user._id,
      description: `User ${user.email} successfully changed password.`,
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/setup-admin
// Development-only / Initial bootstrap method: Creates the first Super Admin only if no users exist in the system.
const setupInitialAdmin = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'Initial administrator setup is disabled because user accounts already exist.',
      });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required to create initial admin.',
      });
    }

    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'super_admin',
      designation: 'Institution System Administrator',
      skills: ['Administration', 'Security', 'Infrastructure', 'Policy'],
    });

    const token = generateToken(admin);

    res.status(201).json({
      success: true,
      message: 'Initial Super Admin created successfully.',
      token,
      user: admin.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Institutional email address is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No institutional account registered with this email address.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Contact the campus IT helpdesk.',
      });
    }

    // Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    await logAudit({
      req: { ...req, user: user.toJSON() },
      action: 'PASSWORD_RESET_REQUESTED',
      targetModel: 'User',
      targetId: user._id,
      description: `Password reset verification code requested for ${user.email}`,
    });

    res.status(200).json({
      success: true,
      message: 'Verification code has been dispatched to your institutional address.',
      // Providing code in response for demonstration / college demo convenience
      resetCode,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, verification code, and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: resetCode,
      resetPasswordExpire: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please request a new code.',
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    await logAudit({
      req: { ...req, user: user.toJSON() },
      action: 'PASSWORD_RESET_SUCCESS',
      targetModel: 'User',
      targetId: user._id,
      description: `Password successfully reset via OTP verification for ${user.email}`,
    });

    res.status(200).json({
      success: true,
      message: 'Password successfully reset! You can now sign in with your new credentials.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  login,
  getMe,
  updateProfile,
  changePassword,
  setupInitialAdmin,
  forgotPassword,
  resetPassword,
};

