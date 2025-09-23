import express from "express";
import cors from "cors";
import errorHandler from "./middlewares/errorHandler.js";
import connectDB from "./db/index.js";
import notFound from "./middlewares/notFound.js";
import api from "./routes/index.js";
import cookieParser from "cookie-parser";

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
