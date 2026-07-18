// This loads first to ensure that the environment variables are available before any other imports.
import "./types/session-augment";
import "./types/express-augment";
import 'dotenv/config';
import app from "./app";
import { PORT } from "./config";
import sessionRoutes from './sessions/sessions.routes';



import 'express-session';
import oauthRoutes from "./oauth/oauth.routes";
import authRoutes from "./routes/authRoutes";
import jwtRoutes from "./jwt/jwt.routes";
import cookieParser from "cookie-parser";

import session from "express-session";

app.use(session({
  secret: "super-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,   // ⭐ MUST be false on localhost
    httpOnly: true
  }
}));

app.use(cookieParser());

// ⭐ MOUNT ROUTES FIRST
app.use("/auth", authRoutes);
app.use('/sessions', sessionRoutes);

app.use("/oauth", oauthRoutes);
app.use("/jwt", jwtRoutes);



const port = PORT;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

