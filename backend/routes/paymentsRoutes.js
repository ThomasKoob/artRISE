import { Router } from "express";
import {
    getPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment,
} from "../controllers/payments.controller.js";
import auth from "../middlewares/auth.js";

const paymentsRouter = Router();

paymentsRouter.get("/me", auth, getPayments);

paymentsRouter.get("/", getPayments);
paymentsRouter.get("/:id", getPaymentById);
paymentsRouter.post("/", createPayment);
paymentsRouter.put("/:id", updatePayment);
paymentsRouter.delete("/:id", deletePayment);

export default paymentsRouter;  
