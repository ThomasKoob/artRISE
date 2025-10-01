import { Router } from "express";
import {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  getOffersByArtwork, // NEU importiert
} from "../controllers/offers.controller.js";
import auth from "../middlewares/auth.js";

const offersRouter = Router();

// User-spezifische Offers (authentifiziert)
offersRouter.get("/me", auth, getOffers);

// WICHTIG: Diese Route MUSS vor "/:id" kommen!
// Alle Offers für ein spezifisches Artwork
offersRouter.get("/artwork/:artworkId", getOffersByArtwork);

// Allgemeine Routes
offersRouter.get("/", getOffers);
offersRouter.get("/:id", getOfferById);
offersRouter.post("/", createOffer);
offersRouter.put("/:id", updateOffer);
offersRouter.delete("/:id", deleteOffer);

export default offersRouter;
