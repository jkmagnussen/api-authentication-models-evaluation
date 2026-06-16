import express from "express";
import helmet from "helmet";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(  cors({
    methods: ["GET", "POST"],
  }));
app.use(express.json());

// Health check / root route
app.get("/", (req, res) => {
  res.send("API running");
});

// Auth routes
app.use("/auth", authRoutes);

app.use(errorHandler);

export default app;
