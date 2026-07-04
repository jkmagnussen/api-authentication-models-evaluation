import { Router } from "express";
import { authorize, token } from "./oauth.controller";
import { validateAccessToken } from "./oauth.service";

const router = Router();

router.post("/authorize", authorize);
router.post("/token", token);

router.get("/protected", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const token = authHeader.split(" ")[1];

  const stored = await validateAccessToken(token);

  if (!stored) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  return res.json({
    message: "OAuth protected route accessed",
    userId: stored.userId
  });
});

export default router;