import { Router } from "express";
import {
  signup,
  register, // Alias
  login,
  logout,
  me,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/auth.controller.js";
import auth from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  registerSchema,
  loginSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from "../schemas/userSchema.js";

const router = Router();

// ✅ Public Routes
router.post("/signup", validate(registerSchema), signup);
router.post("/register", validate(registerSchema), signup); // Beide funktionieren
router.post("/login", validate(loginSchema), login);
router.get("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  resendVerificationEmail
);

// ✅ Protected Routes
router.post("/logout", logout);
router.get("/me", auth, me); // ✅ Diese Route!

export default router;
