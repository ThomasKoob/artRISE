import { z } from "zod";

export const registerSchema = z.object({
  userName: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  avatarUrl: z.string().url(),
  role: z.enum(["artist", "buyer", "admin"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const updateUserSchema = z.object({
  userName: z.string().min(3).max(30).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  avatarUrl: z.string().url().optional(),
  role: z.enum(["artist", "buyer", "admin"]).optional(),
});
