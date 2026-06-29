// This loads first to ensure that the environment variables are available before any other imports.
import 'dotenv/config';
import app from "./app";
import { PORT } from "./config";
import sessionRoutes from './sessions/sessions.routes';
import { sessionMiddleware } from './sessions/sessionConfig';
import 'express-session';

const port = PORT;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

app.use('/sessions', sessionMiddleware, sessionRoutes);