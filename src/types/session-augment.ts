import "express-session";

declare module "express-session" {
  interface SessionData {
    email?: string;
    code_verifier?: string;
    access_token?: string;
    refresh_token?: string;
  }
}