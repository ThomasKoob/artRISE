import { Router } from "express";
import {
  getUserById,
  getUsers,
  updateUser,
  deleteUser,
} from "../controllers/users.controller.js";
// ❌ ENTFERNT: import { register, login, logout } from "../controllers/auth.controller.js";

const router = Router();

// ❌ ENTFERNT: Alle Auth-Routes (die gehören in authRoutes.js!)
// router.post("/", register);
// router.post("/login", login);
// router.post("/logout", logout);

// ✅ NUR User-Management Routes (für Admins)
router.get("/", getUsers);
router.get("/:id", getUserById);
// router.post("/", createUser); // Auch entfernt - Signup ist jetzt /auth/signup
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
