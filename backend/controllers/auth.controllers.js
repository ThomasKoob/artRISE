import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
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
};
