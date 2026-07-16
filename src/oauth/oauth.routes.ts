import { Router } from "express";
import { authorize, token, introspect } from "./oauth.controller";
import { validateAuthorize, validateToken } from "../middleware/validateOAuth";
import { requireScope } from "../middleware/requireScope";
import { oauthLimiter } from "./rateLimit";

const router = Router();

// Apply rate limiting to ALL OAuth2 endpoints
router.post("/authorize", oauthLimiter, validateAuthorize, authorize);
router.post("/token", oauthLimiter, validateToken, token);
router.post("/refresh", oauthLimiter, token); // if you add refresh later, apply limiter here too
router.post("/revoke", oauthLimiter, token);  // same idea

// READ‑protected route
router.get("/protected/read", requireScope("read"), (req, res) => {
  return res.json({
    message: "You have READ access",
    userId: (req as any).userId,
  });
});

// WRITE‑protected route
router.post("/protected/write", requireScope("write"), (req, res) => {
  return res.json({
    message: "You have WRITE access",
    userId: (req as any).userId,
  });
});

// Introspection endpoint (also rate‑limited)
router.post("/introspect", oauthLimiter, introspect);

export default router;
