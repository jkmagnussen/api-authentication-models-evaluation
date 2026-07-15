import { Router } from "express";
import csrf from "csurf";
import { validateLogin } from "../middleware/validateLogin";
import { loginWithSession, getSessionProtected, logoutSession } from "./sessions.controller";
import { requireSession } from "./sessions.middleware";

const router = Router();

// ✅ Cookie-based CSRF protection (no express-session)
const csrfProtection = csrf({ cookie: true });

router.post("/login", validateLogin, loginWithSession);

// Protected route (DB-backed session)
router.get("/protected", requireSession, getSessionProtected);

router.post("/logout", logoutSession);

// CSRF middleware (cookie-based)
router.use(csrfProtection);

// CSRF token endpoint
router.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// CSRF-protected action (requires DB session + valid CSRF token)
router.post("/protected-action", requireSession, (req, res) => {
  res.json({ message: "Protected action completed" });
});

export default router;
