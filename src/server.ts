// This loads first to ensure that the environment variables are available before any other imports.
import "./types/session-augment";
import "./types/express-augment";
import 'dotenv/config';
import app from "./app";
import { PORT } from "./config";
import sessionRoutes from './sessions/sessions.routes';
import { sessionMiddleware } from './sessions/sessionConfig';
import 'express-session';
import oauthRoutes from "./oauth/oauth.routes";
import authRoutes from "./routes/authRoutes";
import jwtRoutes from "./jwt/jwt.routes";

const port = PORT;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

app.use("/auth", authRoutes);
app.use('/sessions', sessionMiddleware, sessionRoutes);
app.use("/oauth", oauthRoutes);
app.use("/jwt", jwtRoutes);