import "./types/session-augment";
import "./types/express-augment";
import 'dotenv/config';
import app from "./app";
import { PORT } from "./config";

import sessionRoutes from './sessions/sessions.routes';
import oauthRoutes from "./oauth/oauth.routes";
import authRoutes from "./routes/authRoutes";
import jwtRoutes from "./jwt/jwt.routes";

import cookieParser from "cookie-parser";
import session from "express-session";

import { createPkcePair } from "./utils/pkce";

app.use(session({
  secret: "super-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true
  }
}));

app.use(cookieParser());

app.use("/auth", authRoutes);
app.use('/sessions', sessionRoutes);
app.use("/oauth", oauthRoutes);
app.use("/jwt", jwtRoutes);

// ⭐ Print PKCE pair on startup
async function printPkce() {
  const { code_verifier, code_challenge } = await createPkcePair();

  console.log("🔐 Generated PKCE Pair:");
  console.log("Verifier:", code_verifier);
  console.log("Challenge:", code_challenge);
  console.log("--------------------------------------------------");
}

printPkce();

const port = PORT;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
