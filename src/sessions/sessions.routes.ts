import { Router } from "express";
import csrf from "csurf";
import { validateLogin } from "../middleware/validateLogin";
import { authLimiter } from "../middleware/rateLimiter";
import { loginWithSession, getSessionProtected, logoutSession } from "./sessions.controller";
import { requireSession } from "./sessions.middleware";

const router = Router();

// Cookie-based CSRF protection
const csrfProtection = csrf({ cookie: true });

// Login (no CSRF needed)
router.post("/login", authLimiter, validateLogin, loginWithSession);

// Protected route (DB-backed session)
router.get("/protected", requireSession, getSessionProtected);

// Logout (no CSRF needed)
router.post("/logout", logoutSession);


// These final two routes are intended for frontend/browser use.
// Postman does not automatically handle cookies or CSRF tokens,
// so these endpoints are not used during backend API testing.

// CSRF token endpoint (frontend would call this)
router.get("/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// CSRF-protected action (requires DB session + valid CSRF token)
router.post("/protected-action", requireSession, csrfProtection, (req, res) => {
  res.json({ message: "Protected action completed" });
});

export default router;
