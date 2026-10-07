import { runJwtChecks, runOAuthChecks, runSessionChecks } from '../../ai-generated/checks';
import {
  runJwtChecksSecondary,
  runOAuthChecksSecondary,
  runSessionChecksSecondary,
} from '../../ai-generated/checks-secondary';

const secureExamples = {
  oauth: `const allowedRedirects = ['https://example.com/callback'];
const allowedScopes = ['read'];
function authorize(req, res) {
  const redirectUri = req.body.redirectUri;
  const state = req.body.state;
  const scope = req.body.scope;
  if (!allowedRedirects.includes(redirectUri)) return res.status(400).json({ error: 'invalid_redirect_uri' });
  if (!state) return res.status(400).json({ error: 'invalid_state' });
  if (!allowedScopes.includes(scope)) return res.status(400).json({ error: 'invalid_scope' });
  return res.status(200).json({ ok: true });
}`,
  jwt: `function verifyToken(token) {
  return verify(token, { audience: 'api', issuer: 'identity', algorithms: ['HS256'] });
}
function issueToken(user) { return sign(user, secret, { expiresIn: '1h' }); }`,
  sessions: `function login(req, res) {
  req.session.regenerate(() => res.cookie('sid', 'value', { httpOnly: true, secure: true, sameSite: 'lax' }));
}
function logout(req, res) {
  req.session.destroy(() => res.clearCookie('sid'));
}`,
};

const weakenedExamples = {
  oauth: `function authorize(req, res) { return res.status(200).json({ scope: 'admin' }); }`,
  jwt: `function verifyToken(token) { return verify(token, { algorithms: ['none'] }); }
function issueToken(user) { return sign(user, null, { algorithm: 'none', expiresIn: '999y' }); }`,
  sessions: `function login(req, res) { res.cookie('sid', 'value', { httpOnly: false, secure: false, sameSite: 'none' }); }
function logout(req, res) { return res.status(200).json({ ok: true }); }`,
};

const checkerPairs = [
  { model: 'oauth', primary: runOAuthChecks, secondary: runOAuthChecksSecondary },
  { model: 'jwt', primary: runJwtChecks, secondary: runJwtChecksSecondary },
  { model: 'sessions', primary: runSessionChecks, secondary: runSessionChecksSecondary },
] as const;

describe('AI static heuristic calibration', () => {
  it.each(checkerPairs)('$model primary and secondary checkers distinguish the calibration controls', ({ model, primary, secondary }) => {
    const securePrimary = primary(secureExamples[model]);
    const secureSecondary = secondary(secureExamples[model]);
    const weakenedPrimary = primary(weakenedExamples[model]);
    const weakenedSecondary = secondary(weakenedExamples[model]);

    expect(securePrimary.every((check) => check.passed)).toBe(true);
    expect(secureSecondary.every((check) => check.passed)).toBe(true);
    expect(weakenedPrimary.some((check) => !check.passed)).toBe(true);
    expect(weakenedSecondary.some((check) => !check.passed)).toBe(true);
  });
});