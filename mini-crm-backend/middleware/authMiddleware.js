import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * protect
 * ───────
 * Verifies the Bearer token from the Authorization header.
 * On success: attaches `req.user` (without password) and calls next().
 * On failure: returns 401 immediately.
 *
 * Usage: router.get("/protected", protect, controller)
 */
const protect = async (req, res, next) => {
  let token;

  // Standard Bearer token header: "Authorization: Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized – no token provided",
    });
  }

  try {
    // Verify signature + expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach fresh user document (excludes password via model select:false)
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists",
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Not authorized – token invalid or expired",
    });
  }
};

/**
 * adminOnly
 * ─────────
 * Must be used AFTER `protect`.
 * Restricts a route to users with role === "admin".
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({
    success: false,
    message: "Access denied – admins only",
  });
};

export { protect, adminOnly };
