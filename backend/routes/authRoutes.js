import { Router } from "express";
import {
  signup,
  login,
  logout,
  me,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/auth.controller.js";
import auth from "../middlewares/auth.js"; // Your existing middleware
import { validate } from "../middlewares/validate.js";
import {
  registerSchema,
  loginSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from "../schemas/userSchema.js";

const router = Router();

// Public Routes (no auth required)
router.post("/signup", validate(registerSchema), signup);
router.post("/register", validate(registerSchema), signup); // Alias for compatibility
router.post("/login", validate(loginSchema), login);
router.get("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  resendVerificationEmail
);

// Protected Routes (auth required)
router.post("/logout", logout);
router.get("/me", auth, me);

export default router;
