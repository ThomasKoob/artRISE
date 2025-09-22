import { Router } from "express";
import {
  getUserById,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/users.controller.js";
import { register, login, logout } from "../controllers/auth.controller.js";

const router = Router();

router.post("/", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
