import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";

import oauthRoutes from "./oauth/oauth.routes";
import sessionRoutes from "./sessions/sessions.routes";
import jwtRoutes from "./jwt/jwt.routes";

import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST"]
}));

app.use(express.json());
app.use(cookieParser());

// Session middleware
app.use(session({
  secret: "super-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "none"
  }
}));

app.get("/", (req, res) => {
  res.send("API running");
});

// Routes
app.use("/oauth", oauthRoutes);
app.use("/sessions", sessionRoutes);
app.use("/jwt", jwtRoutes);

app.use(errorHandler);

export default app;