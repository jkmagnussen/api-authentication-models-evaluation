import express from "express";
import helmet from "helmet";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import oauthRoutes from "./oauth/oauth.routes"; 
import sessionRoutes from "./sessions/sessions.routes"; 
import jwtRouter from "./jwt/jwt.routes";
import cookieParser from "cookie-parser";
import session from "express-session";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST"]
}));

app.use(express.json());

// ⭐ Required for cookie-based CSRF
app.use(cookieParser());

// ⭐ ADD SESSION HERE — AFTER cookieParser, BEFORE routes
app.use(session({
  secret: "super-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,     // HTTPS only if true
    httpOnly: true,
    sameSite: "none"   // ⭐ REQUIRED for PKCE redirects
  }
}));

// Health check / root route
app.get("/", (req, res) => {
  res.send("API running");
});

// Auth routes
app.use("/auth", authRoutes);

// OAuth routes
app.use("/oauth", oauthRoutes);

// Session routes (login, logout, protected, CSRF)
app.use("/sessions", sessionRoutes);

// JWT routes
app.use("/jwt", jwtRouter);

app.use(errorHandler);

export default app;
