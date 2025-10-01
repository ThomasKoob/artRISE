// backend/controllers/auth.controller.js
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Helper function für Cookie-Settings
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: true, // ✅ IMMER true (auch in Development mit Render Backend)
    sameSite: "none", // ✅ WICHTIG: 'none' für Cross-Origin
    maxAge: Number(process.env.JWT_EXPIRES_IN_DAYS || 7) * 24 * 60 * 60 * 1000,
    path: "/",
  };
};

const register = async (req, res, next) => {
  try {
    const { userName, email, password, avatarUrl, role } = req.body;
    if (!userName || !email || !password) {
      return res.status(400).json({
        message: "username, email und password sind Pflichtfelder",
      });
    }
    const emailExists = await User.exists({ email });
    if (emailExists) {
      return res.status(409).json({ message: "Email already in use" });
    }
    const userNameExists = await User.exists({ userName });
    if (userNameExists) {
      return res.status(409).json({ message: "Username already in use" });
    }
    const salt = await bcrypt.genSalt(13);
    const hashedPassword = await bcrypt.hash(password, salt);
    const created = await User.create({
      userName,
      email,
      password: hashedPassword,
      role: role || "buyer",
    });

    const user = created.toObject();
    delete user.password;

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN_DAYS + "d" }
    );

    // ✅ Verwende die Helper-Funktion
    res.cookie("token", token, getCookieOptions());

    res.status(201).json({ msg: "User registered", data: user });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password").lean();
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    delete user.password;

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN_DAYS + "d" }
    );

    // ✅ Verwende die Helper-Funktion
    res.cookie("token", token, getCookieOptions());

    res.json({ msg: "User logged in", data: user });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  // ✅ Verwende die Helper-Funktion
  res.clearCookie("token", getCookieOptions());
  res.json({ msg: "User logged out" });
};

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

export { me, register, login, logout };
