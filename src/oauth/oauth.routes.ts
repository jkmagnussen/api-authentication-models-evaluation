import { Router } from "express";
import { authorize, token } from "./oauth.controller";

const router = Router();

router.post("/authorize", authorize);
router.post("/token", token);

export default router;