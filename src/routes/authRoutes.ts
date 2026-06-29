import { Router } from "express";
import { register, login } from "../controllers/authController";
import { validateRegister } from "../middleware/validateRegister";
import { validateLogin } from "../middleware/validateLogin";
import authLimiter from "../middleware/rateLimiter";

const router = Router();

// Route to create a user. 
router.post("/register", authLimiter,validateRegister, register);
// Route to Login.
router.post("/login", authLimiter,validateLogin, login);

export default router;
