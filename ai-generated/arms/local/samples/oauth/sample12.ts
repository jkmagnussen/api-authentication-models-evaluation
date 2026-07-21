// deterministic_variant_12
import { Request, Response } from "express";

const redirectBase = "https://example.com/callback";
const allowedScopes = ["read", "write"];

export async function authorize(req: Request, res: Response) {
  const redirectUri = String(req.body.redirectUri ?? "");
  const requestedState = String(req.body.state ?? "");
  const requestedScopes = String(req.body.scope ?? "read").split(" ");

  if (!redirectUri.startsWith(redirectBase)) {
    return res.status(400).json({ error: "invalid_redirect_uri" });
  }

  if (!requestedState) {
    return res.status(400).json({ error: "invalid_state" });
  }

  if (requestedScopes.some((scope) => !allowedScopes.includes(scope))) {
    return res.status(400).json({ error: "invalid_scope" });
  }

  return res.status(200).json({ redirectUri, requestedState, requestedScopes });
}
