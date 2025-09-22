import { Router } from "express";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../controllers/orders.controller.js";
import auth from "../middlewares/auth.js";

const ordersRouter = Router();

ordersRouter.get("/me", auth, getOrders);

ordersRouter.get("/", auth, getOrders);
ordersRouter.get("/:id", auth, getOrderById);
ordersRouter.post("/", createOrder);
ordersRouter.put("/:id", updateOrder);
ordersRouter.delete("/:id", deleteOrder);

export default ordersRouter;
