import express from "express";
import helmet from "helmet";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import oauthRoutes from "./oauth/oauth.routes"; 
import sessionRoutes from "./sessions/sessions.routes"; 
import jwtRouter from "./jwt/jwt.routes";
import cookieParser from "cookie-parser";

import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(  cors({
    methods: ["GET", "POST"],
  }));
app.use(express.json());
app.use(cookieParser());

// Health check / root route
app.get("/", (req, res) => {
  res.send("API running");
});



// Auth routes
app.use("/auth", authRoutes);

// OAuth routes
app.use("/oauth", oauthRoutes);

// Session routes
app.use("/sessions", sessionRoutes);

// JWT routes
app.use("/jwt", jwtRouter);

app.use(errorHandler);

export default app;
