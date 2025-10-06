import { z } from "zod";

//Signup/Register Schema
export const registerSchema = z.object({
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  avatarUrl: z.string().url("Invalid URL").optional(),
  role: z.enum(["buyer", "seller", "admin"]).optional(),
});

// Login Schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Update User Schema
export const updateUserSchema = z.object({
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .trim()
    .optional(),
  email: z.string().email("Invalid email address").toLowerCase().optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  avatarUrl: z.string().url("Invalid URL").optional(),
  role: z.enum(["buyer", "seller", "admin"]).optional(),
});

//  Resend Verification Schema
export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

//  Verify Email Schema
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});
