import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ── Helper: sign a JWT ────────────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// ── Helper: build the response payload (strips sensitive fields) ──────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/register
//  Creates a new user.  Password is hashed by the User model's pre-save hook.
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Guard: duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = await User.create({ name, email, password, role });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/login
//  Validates credentials and returns a JWT.
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic presence check (Mongoose validation won't run on findOne)
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Explicitly select password because the model hides it by default
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/auth/me   (protected)
//  Returns the currently authenticated user's profile.
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the protect middleware
    res.status(200).json({
      success: true,
      user: {
        id:        req.user._id,
        name:      req.user.name,
        email:     req.user.email,
        role:      req.user.role,
        createdAt: req.user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export { register, login, getMe };
