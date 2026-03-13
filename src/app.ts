import express from "express";
import authRoutes from "./routes/authRoutes";

const app = express();
app.use(express.json());

// Health check / root route
app.get("/", (req, res) => {
  res.send("API running");
});

// Auth routes
app.use("/auth", authRoutes);


export default app;
