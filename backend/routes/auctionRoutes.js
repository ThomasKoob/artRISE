import { Router } from "express";
import {
  getAuctions,
  getAuctionById,
  createAuction,
  updateAuction,
  deleteAuction,
  getAuctionArtworks, // Neue Funktion
} from "../controllers/auctions.controller.js";
import auth from "../middlewares/auth.js";

const auctionRouter = Router();

auctionRouter.get(
  "/me",
  auth,
  /* requireRole("artist", "admin"),*/ getAuctions
);
auctionRouter.get("/", getAuctions);
auctionRouter.get("/:id", getAuctionById);

// Neuer Endpoint für Artworks einer Auktion
auctionRouter.get("/:id/artworks", getAuctionArtworks);

auctionRouter.post(
  "/",
  auth,
  /* requireRole("artist", "admin"),*/ createAuction
);
auctionRouter.put(
  "/:id",
  auth,
  /* requireRole("artist", "admin"),*/ updateAuction
);
auctionRouter.delete("/:id", deleteAuction);

export default auctionRouter;
