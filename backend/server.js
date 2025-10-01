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

// CORS Configuration für Production
const corsOptions = {
  origin: function (origin, callback) {
    // Erlaubte Origins aus Environment Variable + localhost für Development
    const allowedOrigins = [
      process.env.CLIENT_URL,
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5174", // Vite alternative port
    ].filter(Boolean);

    // Erlaube Requests ohne Origin (z.B. Postman, Mobile Apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // 24 Stunden Cache für CORS Preflight
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.set("trust proxy", 1);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api", api);

// Static files für Uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Error & Not Found Middleware (Reihenfolge wichtig!)
app.use(notFound);
app.use(errorHandler);

// Graceful Shutdown Handler
const gracefulShutdown = () => {
  console.log("Received shutdown signal, closing server gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  // Force shutdown nach 10 Sekunden
  setTimeout(() => {
    console.error("Forcing shutdown");
    process.exit(1);
  }, 10000);
};

// Server starten
let server;
connectDB()
  .then(() => {
    server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Health check: http://localhost:${port}/health`);
      if (process.env.CLIENT_URL) {
        console.log(`Allowed client: ${process.env.CLIENT_URL}`);
      }
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  });

// Shutdown Handlers
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
