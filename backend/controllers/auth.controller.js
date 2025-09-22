import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const register = async (req, res) => {
  const { email, password } = req.body;

  //Mail überprüfen, ob schon vorhanden
  const emailExists = await User.exists({ email });
  if (emailExists) {
    throw new Error("Email already in use", { cause: 409 });
  }
  // Passworrt absichern
  const salt = await bcrypt.genSalt(13);
  const hashedPassword = await bcrypt.hash(password, salt);

  // User speichern
  const user = await User.create({
    ...req.body,
    password: hashedPassword,
  }).toObject();
  delete user.password;

  const token = JsonWebTokenError.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    expires: new Date(
      Date.now() + Number(process.env.JWT_EXPIRES_IN_DAYS) * 24 * 60 * 60 * 1000
    ),
  });

  res.json({ msg: "User registered", data: user });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  // Finde User in DB
  const user = await User.findOne({ email }).select("+password").lean();
  if (!user) throw new Error("Invalid credentials", { cause: 401 });

  // Vergleiche PW
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials", { cause: 401 });
  delete user.password;

  const token = jwt.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN_DAYS + "d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    expires: new Date(
      Date.now() + Number(process.env.JWT_EXPIRES_IN_DAYS) * 24 * 60 * 60 * 1000
    ),
  });

  res.json({ msg: "User logged in", data: user });
};

const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure,
    sameSite: "lax",
  });
  res.json({ msg: "User logged out" });
};

const me = async (req, res, next) => {
  try {
    if (!req.user?._id)
      return res.status(401).json({ message: "Not authenticated" });

    const u = await User.findById(req.user._id).select("-passwordHash -__v");
    if (!u) return res.status(404).json({ message: "User not found" });

    res.json(u);
  } catch (e) {
    next(e);
  }
};

export { me, register, login, logout };
