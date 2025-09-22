import { Router } from "express";
import { register, login, logout , me} from "../controllers/auth.controller.js";
import auth from "../middlewares/auth.js";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/register", register);
router.get("/me", auth, me);






export default router;
