import { Router } from "express";
import { jwtLogin, jwtProtected } from "./jwt.controller";
import { jwtAuth } from "./jwt.middleware";
import { validateLogin } from "../middleware/validateLogin";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/login", authLimiter, validateLogin, jwtLogin);
router.get("/protected", jwtAuth, jwtProtected);

export default router;