import { expandTemplateSamples, SAMPLE_COUNT, writeSampleFiles } from "../common";
import { GENERATOR_PROMPTS } from "../generator-prompts";

const PROMPT = GENERATOR_PROMPTS.oauth;

const samples = [
`import { Request, Response } from "express";

const allowedRedirects = new Set(["https://example.com/callback"]);
const allowedScopes = new Set(["read", "write"]);

export async function authorize(req: Request, res: Response) {
  const { redirectUri, state, scope } = req.body;

  if (!allowedRedirects.has(redirectUri)) {
    return res.status(400).json({ error: "invalid_redirect_uri" });
  }

  if (typeof state !== "string" || state.length < 8) {
    return res.status(400).json({ error: "invalid_state" });
  }

  const requestedScopes = String(scope ?? "read").split(" ");
  const invalidScope = requestedScopes.some((entry) => !allowedScopes.has(entry));

  if (invalidScope) {
    return res.status(400).json({ error: "invalid_scope" });
  }

  return res.status(200).json({ redirectUri, state, scope: requestedScopes.join(" ") });
}
`,
`import { Request, Response } from "express";

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
`,
`import { Request, Response } from "express";

const allowedRedirects = ["https://example.com/callback"];

export async function authorize(req: Request, res: Response) {
  const redirectUri = req.body.redirectUri;
  const scope = req.body.scope ?? "read";

  if (!allowedRedirects.includes(redirectUri)) {
    return res.status(400).json({ error: "invalid_redirect_uri" });
  }

  return res.status(200).json({ redirectUri, scope });
}
`,
`import { Request, Response } from "express";

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
`,
`import { Request, Response } from "express";

const allowedRedirects = ["https://example.com/callback", "http://localhost/callback"];
const allowedScopes = ["read"];

export async function authorize(req: Request, res: Response) {
  const redirectUri = String(req.body.redirectUri ?? "");
  const state = req.body.state;
  const scope = String(req.body.scope ?? "read");

  if (!allowedRedirects.includes(redirectUri)) {
    return res.status(400).json({ error: "invalid_redirect_uri" });
  }

  if (state && typeof state !== "string") {
    return res.status(400).json({ error: "invalid_state" });
  }

  if (!allowedScopes.includes(scope)) {
    return res.status(400).json({ error: "invalid_scope" });
  }

  return res.status(200).json({ redirectUri, state, scope });
}
`,
];

void PROMPT;
writeSampleFiles("oauth", expandTemplateSamples(samples, SAMPLE_COUNT));
console.log(`Generated OAuth samples (${SAMPLE_COUNT}).`);
