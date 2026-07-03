import { Router } from "express";
import { jwtLogin, jwtProtected } from "./jwt.controller";
import { jwtAuth } from "./jwt.middleware";

const router = Router();

router.post("/login", jwtLogin);
router.get("/protected", jwtAuth, jwtProtected);

export default router;