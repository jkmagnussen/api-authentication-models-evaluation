import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }

  interface Session {
    userId?: string;
  }
}