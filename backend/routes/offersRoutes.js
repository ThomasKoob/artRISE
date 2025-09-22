import   { Router } from "express";
import {
    getOffers,
    getOfferById,
    createOffer,
    updateOffer,
    deleteOffer,
} from "../controllers/offers.controller.js";
import auth from "../middlewares/auth.js";

const offersRouter = Router();

offersRouter.get("/me", auth, getOffers);

offersRouter.get("/", getOffers);
offersRouter.get("/:id", getOfferById);
offersRouter.post("/", createOffer);
offersRouter.put("/:id", updateOffer);
offersRouter.delete("/:id", deleteOffer);

export default offersRouter;        