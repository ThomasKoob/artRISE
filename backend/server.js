import express from "express";
import cors from "cors";
import errorHandler from "./middlewares/errorHandler.js";
import connectDB from "./db/index.js";
import notFound from "./middlewares/notFound.js";

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

// Routes

// Middlewares
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
