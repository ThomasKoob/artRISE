import authRoutes from "./authRoutes.js";
import usersRoutes from "./usersRoutes.js";
import auctionRoutes from "./auctionRoutes.js";
import artworkRoutes from "./artworkRoutes.js"; 
import offersRoutes from "./offersRoutes.js";
import ordersRoutes from "./ordersRoutes.js";
import paymentsRoutes from "./paymentsRoutes.js";

const router = Router();
router.get("/", (req, res) => {
  res.json({ message: "Welcome to artRise API" });
});

r.use("/auth", authRoutes);
r.use("/users", usersRoutes);
r.use("/auctions", auctionRoutes);
r.use("/auctions", artworkRoutes); 
r.use("/artworks", offersRoutes);
r.use("/orders", ordersRoutes);
r.use("/payments", paymentsRoutes);

export default router;
