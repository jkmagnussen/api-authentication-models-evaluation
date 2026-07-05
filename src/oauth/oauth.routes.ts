import { Router } from "express";
import { authorize, token } from "./oauth.controller";
import { validateAuthorize, validateToken } from "../middleware/validateOAuth";
import { validateAccessToken } from "./oauth.service";

const router = Router();

router.post("/authorize", validateAuthorize, authorize);
router.post("/token", validateToken, token);

router.get("/protected", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  const stored = await validateAccessToken(token);

  if (!stored) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

return res.json({
  message: "Protected content"
});
});

export default router;