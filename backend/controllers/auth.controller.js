import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "../services/email.service.js";

// Helper function for cookie settings
const getCookieOptions = (req) => {
  const isProd = process.env.NODE_ENV === "production";
  const isHttps = req?.secure || req?.headers["x-forwarded-proto"] === "https";

  return {
    httpOnly: true,
    secure: isProd ? true : !!isHttps,
    sameSite: isProd ? "none" : "lax",
    maxAge: Number(process.env.JWT_EXPIRES_IN_DAYS || 7) * 24 * 60 * 60 * 1000,
    path: "/",
  };
};

// ✅ FIXED: Signup with email verification (NO manual hashing)
const signup = async (req, res, next) => {
  try {
    const { userName, email, password, avatarUrl, role } =
      req.validatedData || req.body;

    // Check if email already exists
    const emailExists = await User.exists({ email });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Check if username already exists
    const userNameExists = await User.exists({ userName });
    if (userNameExists) {
      return res.status(409).json({
        success: false,
        message: "Username is already taken",
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // ✅ NO MANUAL HASHING - User model will handle it!
    // ❌ REMOVED:
    // const salt = await bcrypt.genSalt(13);
    // const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ Create user - password will be hashed by pre-save hook
    const created = await User.create({
      userName,
      email,
      password, // ✅ Plain password - model hashes it automatically!
      role: role || "buyer",
      avatarUrl,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    const user = created.toObject();
    delete user.password;

    // Send verification email
    try {
      await sendVerificationEmail(email, userName, verificationToken);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      return res.status(201).json({
        success: true,
        message:
          "Account created, but verification email could not be sent. Please contact support.",
        user: {
          id: user._id,
          userName: user.userName,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
        },
      });
    }

    // Successful registration
    res.status(201).json({
      success: true,
      message:
        "Registration successful! Please check your email to verify your account.",
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ✅ IMPROVED: Login with User model's comparePassword method
const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedData || req.body;

    // ✅ Don't use .lean() - we need the model instance for comparePassword
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address first",
        needsVerification: true,
      });
    }

    // ✅ Use User model's comparePassword method
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // ✅ Convert to plain object
    const userObject = user.toObject();
    delete userObject.password;

    const token = jwt.sign(
      { _id: userObject._id, role: userObject.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN_DAYS + "d" }
    );

    res.cookie("token", token, getCookieOptions(req));

    res.json({
      success: true,
      msg: "User logged in",
      data: userObject,
    });
  } catch (err) {
    next(err);
  }
};

// Verify email
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.validatedData || req.query;

    // Find user with this token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }, // Token still valid?
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link",
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email successfully verified! You can now log in.",
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Resend verification email
const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.validatedData || req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send email
    await sendVerificationEmail(email, user.userName, verificationToken);

    res.status(200).json({
      success: true,
      message: "Verification email has been resent",
    });
  } catch (err) {
    next(err);
  }
};

// Logout
const logout = (req, res) => {
  res.clearCookie("token", getCookieOptions(req));
  res.json({ msg: "User logged out" });
};

// Get current user
const me = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const u = await User.findById(req.user._id).select("-password -__v");
    if (!u) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(u);
  } catch (e) {
    next(e);
  }
};

// Backward compatibility alias
const register = signup;

// Exports
export {
  signup,
  register,
  login,
  logout,
  me,
  verifyEmail,
  resendVerificationEmail,
};
