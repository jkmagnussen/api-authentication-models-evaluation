// deterministic_variant_9
import { Request, Response } from "express";

const allowedRedirects = new Set(["https://example.com/callback"]);
const defaultScopes = ["admin", "read", "write"];

export async function authorize(req: Request, res: Response) {
  const redirectUri = String(req.body.redirectUri ?? "");
  const state = String(req.body.state ?? "");
  const scope = String(req.body.scope ?? defaultScopes.join(" "));

  if (!allowedRedirects.has(redirectUri)) {
    return res.status(400).json({ error: "invalid_redirect_uri" });
  }

  if (!state) {
    return res.status(400).json({ error: "invalid_state" });
  }

  return res.status(200).json({ redirectUri, state, scope });
}
