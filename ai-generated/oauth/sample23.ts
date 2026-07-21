// deterministic_variant_23
import { Request, Response } from "express";

const allowedRedirects = ["https://example.com/callback"];

export async function authorize(req: Request, res: Response) {
  const redirectUri = req.body.redirectUri;
  const scope = req.body.scope ?? "read";

  if (!allowedRedirects.includes(redirectUri)) {
    return res.status(400).json({ error: "invalid_redirect_uri" });
  }

  return res.status(200).json({ redirectUri, scope });
}
