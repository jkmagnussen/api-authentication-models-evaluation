import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";

import oauthRoutes from "./oauth/oauth.routes";
import sessionRoutes from "./sessions/sessions.routes";
import jwtRoutes from "./jwt/jwt.routes";
import { getVariantOverrides } from "./variant-overrides";

import { errorHandler } from "./middleware/errorHandler";

const app = express();
const variantOverrides = getVariantOverrides();
const sessionCookieOverride = variantOverrides.sessions?.cookie;

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
    secure: sessionCookieOverride?.secure ?? false,
    httpOnly: sessionCookieOverride?.httpOnly ?? true,
    sameSite: sessionCookieOverride?.sameSite ?? "none"
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