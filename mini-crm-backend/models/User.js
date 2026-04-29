import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * UserSchema
 * ──────────
 * Stores CRM users.  Passwords are hashed pre-save via a Mongoose hook so no
 * controller ever needs to remember to call bcrypt manually.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: ["admin", "agent"],
      default: "agent",
    },
  },
  { timestamps: true }
);

// ── Pre-save hook: hash password only when it's new/changed ──────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: compare plain password with hash ─────────────────────────
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

export default mongoose.model("User", userSchema);
