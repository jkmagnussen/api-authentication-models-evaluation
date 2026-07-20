import { writeResult } from "./common";
import { runJwtChecks, runOAuthChecks, runSessionChecks } from "./checks";

type ControlSample = {
  label: string;
  expectedPass: boolean;
  sourceText: string;
};

const controlSamples: Record<string, ControlSample[]> = {
  oauth: [
    {
      label: "positive-control-oauth",
      expectedPass: true,
      sourceText: `const allowedRedirects = ["https://example.com/callback"];
const allowedScopes = ["read"];
function authorize(req, res) {
  const redirectUri = req.body.redirectUri;
  const state = req.body.state;
  const scope = req.body.scope;
  if (!allowedRedirects.includes(redirectUri)) return res.status(400).json({ error: "invalid_redirect_uri" });
  if (!state) return res.status(400).json({ error: "invalid_state" });
  if (!allowedScopes.includes(scope)) return res.status(400).json({ error: "invalid_scope" });
  return res.status(200).json({ ok: true });
}`,
    },
    {
      label: "negative-control-oauth",
      expectedPass: false,
      sourceText: `function authorize(req, res) {
  return res.status(200).json({ scope: "admin" });
}`,
    },
  ],
  jwt: [
    {
      label: "positive-control-jwt",
      expectedPass: true,
      sourceText: `function jwtAuth(token) { return verify(token, { audience: "api-auth-eval", issuer: "api-auth-service", algorithms: ["HS256"] }); }
function signToken(userId) { return sign({ userId }, secret, { audience: "api-auth-eval", issuer: "api-auth-service", algorithm: "HS256", expiresIn: "1h" }); }`,
    },
    {
      label: "negative-control-jwt",
      expectedPass: false,
      sourceText: `function jwtAuth(token) { return verify(token, { algorithms: ["none"] }); }
function signToken(userId) { return sign({ userId }, null, { algorithm: "none", expiresIn: "999y" }); }`,
    },
  ],
  sessions: [
    {
      label: "positive-control-sessions",
      expectedPass: true,
      sourceText: `function login(req, res) { req.session.regenerate(() => { res.cookie("sid", "1", { httpOnly: true, secure: true, sameSite: "lax" }); }); }
function logout(req, res) { req.session.destroy(() => res.clearCookie("sid")); }`,
    },
    {
      label: "negative-control-sessions",
      expectedPass: false,
      sourceText: `function login(req, res) { res.cookie("sid", "1", { secure: false, sameSite: "none" }); }
function logout(req, res) { return res.status(200).json({ ok: true }); }`,
    },
  ],
};

const runners = {
  oauth: runOAuthChecks,
  jwt: runJwtChecks,
  sessions: runSessionChecks,
};

for (const [model, samples] of Object.entries(controlSamples)) {
  const runChecks = runners[model as keyof typeof runners];

  for (const sample of samples) {
    const checks = runChecks(sample.sourceText);
    const passed = checks.every((check) => check.passed);

    writeResult(`${sample.label}.json`, {
      model,
      label: sample.label,
      expectedPass: sample.expectedPass,
      actualPass: passed,
      matchedExpectation: sample.expectedPass === passed,
      checks,
    });
  }
}

console.log("Validated AI heuristic controls.");