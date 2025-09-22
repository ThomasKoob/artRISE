import { Router } from "express";
import authRoutes from "./authRoutes.js";
import usersRoutes from "./usersRoutes.js";
import auctionRoutes from "./auctionRoutes.js";
import artworkRoutes from "./artworkRoutes.js";
import offersRoutes from "./offersRoutes.js";
import ordersRoutes from "./ordersRoutes.js";
// import paymentsRoutes from "./paymentsRoutes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Welcome to artRise API" });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/auctions", auctionRoutes);
router.use("/artworks", artworkRoutes);
router.use("/offers", offersRoutes);
router.use("/orders", ordersRoutes);
// router.use("/payments", paymentsRoutes);

export default router;
