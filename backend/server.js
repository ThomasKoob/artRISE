import express from "express";
import cors from "cors";
import errorHandler from "./middlewares/errorHandler.js";
import connectDB from "./db/index.js";
import notFound from "./middlewares/notFound.js";
import api from "./routes/index.js";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api", api);

// Error & Not Found Middleware
app.use(errorHandler);
app.use(notFound);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Start server
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  });
