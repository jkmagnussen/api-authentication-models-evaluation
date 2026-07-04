import { Router } from "express";
import { jwtLogin, jwtProtected } from "./jwt.controller";
import { jwtAuth } from "./jwt.middleware";
import { validateLogin } from "../middleware/validateLogin";

const router = Router();

router.post("/login", validateLogin,jwtLogin);
router.get("/protected", jwtAuth, jwtProtected);

export default router;