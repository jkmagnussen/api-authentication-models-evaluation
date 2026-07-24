import fs from 'fs';
import { SAMPLE_COUNT, getSamplePath, readSample, writeResult } from './common';
import { runJwtChecks, runOAuthChecks, runSessionChecks } from './checks';
import {
  runJwtChecksSecondary,
  runOAuthChecksSecondary,
  runSessionChecksSecondary,
} from './checks-secondary';

type ControlSample = {
  label: string;
  expectedPass: boolean;
  sourceText: string;
};

const controlSamples: Record<string, ControlSample[]> = {
  oauth: [
    {
      label: 'positive-control-oauth',
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
      label: 'negative-control-oauth',
      expectedPass: false,
      sourceText: `function authorize(req, res) {
  return res.status(200).json({ scope: "admin" });
}`,
    },
  ],
  jwt: [
    {
      label: 'positive-control-jwt',
      expectedPass: true,
      sourceText: `function jwtAuth(token) { return verify(token, { audience: "api-auth-eval", issuer: "api-auth-service", algorithms: ["HS256"] }); }
function signToken(userId) { return sign({ userId }, secret, { audience: "api-auth-eval", issuer: "api-auth-service", algorithm: "HS256", expiresIn: "1h" }); }`,
    },
    {
      label: 'negative-control-jwt',
      expectedPass: false,
      sourceText: `function jwtAuth(token) { return verify(token, { algorithms: ["none"] }); }
function signToken(userId) { return sign({ userId }, null, { algorithm: "none", expiresIn: "999y" }); }`,
    },
  ],
  sessions: [
    {
      label: 'positive-control-sessions',
      expectedPass: true,
      sourceText: `function login(req, res) { req.session.regenerate(() => { res.cookie("sid", "1", { httpOnly: true, secure: true, sameSite: "lax" }); }); }
function logout(req, res) { req.session.destroy(() => res.clearCookie("sid")); }`,
    },
    {
      label: 'negative-control-sessions',
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

const secondaryRunners = {
  oauth: runOAuthChecksSecondary,
  jwt: runJwtChecksSecondary,
  sessions: runSessionChecksSecondary,
};

type BinaryLabel = 0 | 1;

function cohenKappa(pairs: Array<{ primary: BinaryLabel; secondary: BinaryLabel }>): number | null {
  if (pairs.length === 0) return null;

  const counts = {
    pp: 0,
    pn: 0,
    np: 0,
    nn: 0,
  };

  for (const pair of pairs) {
    if (pair.primary === 1 && pair.secondary === 1) counts.pp += 1;
    if (pair.primary === 1 && pair.secondary === 0) counts.pn += 1;
    if (pair.primary === 0 && pair.secondary === 1) counts.np += 1;
    if (pair.primary === 0 && pair.secondary === 0) counts.nn += 1;
  }

  const total = pairs.length;
  const pObserved = (counts.pp + counts.nn) / total;
  const pPrimaryPos = (counts.pp + counts.pn) / total;
  const pPrimaryNeg = 1 - pPrimaryPos;
  const pSecondaryPos = (counts.pp + counts.np) / total;
  const pSecondaryNeg = 1 - pSecondaryPos;
  const pExpected = pPrimaryPos * pSecondaryPos + pPrimaryNeg * pSecondaryNeg;

  if (1 - pExpected === 0) return null;
  return (pObserved - pExpected) / (1 - pExpected);
}

function rawAgreementRate(
  pairs: Array<{ primary: BinaryLabel; secondary: BinaryLabel }>
): number | null {
  if (pairs.length === 0) return null;
  const agreements = pairs.filter((pair) => pair.primary === pair.secondary).length;
  return agreements / pairs.length;
}

function runAgreementAudit() {
  const controlPairs: Array<{ primary: BinaryLabel; secondary: BinaryLabel }> = [];
  const samplePairsByModel: Record<
    string,
    Array<{ primary: BinaryLabel; secondary: BinaryLabel }>
  > = {
    oauth: [],
    jwt: [],
    sessions: [],
  };

  for (const [model, samples] of Object.entries(controlSamples)) {
    const runPrimary = runners[model as keyof typeof runners];
    const runSecondary = secondaryRunners[model as keyof typeof secondaryRunners];

    for (const sample of samples) {
      const primaryPass = runPrimary(sample.sourceText).every((check) => check.passed);
      const secondaryPass = runSecondary(sample.sourceText).every((check) => check.passed);
      controlPairs.push({ primary: primaryPass ? 1 : 0, secondary: secondaryPass ? 1 : 0 });
    }
  }

  for (const model of ['oauth', 'jwt', 'sessions']) {
    const runPrimary = runners[model as keyof typeof runners];
    const runSecondary = secondaryRunners[model as keyof typeof secondaryRunners];

    for (let index = 1; index <= SAMPLE_COUNT; index += 1) {
      const samplePath = getSamplePath(model, index);
      if (!fs.existsSync(samplePath)) continue;

      const sourceText = readSample(model, index);
      const primaryPass = runPrimary(sourceText).every((check) => check.passed);
      const secondaryPass = runSecondary(sourceText).every((check) => check.passed);

      samplePairsByModel[model].push({
        primary: primaryPass ? 1 : 0,
        secondary: secondaryPass ? 1 : 0,
      });
    }
  }

  const allSamplePairs = [
    ...samplePairsByModel.oauth,
    ...samplePairsByModel.jwt,
    ...samplePairsByModel.sessions,
  ];

  writeResult('checker-agreement-summary.json', {
    generatedAt: new Date().toISOString(),
    controlAgreement: {
      observations: controlPairs.length,
      kappa: cohenKappa(controlPairs),
      rawAgreementRate: rawAgreementRate(controlPairs),
      disagreementCount: controlPairs.filter((pair) => pair.primary !== pair.secondary).length,
    },
    generatedSampleAgreement: {
      observations: allSamplePairs.length,
      kappa: cohenKappa(allSamplePairs),
      rawAgreementRate: rawAgreementRate(allSamplePairs),
      disagreementCount: allSamplePairs.filter((pair) => pair.primary !== pair.secondary).length,
      byModel: {
        oauth: {
          observations: samplePairsByModel.oauth.length,
          kappa: cohenKappa(samplePairsByModel.oauth),
          rawAgreementRate: rawAgreementRate(samplePairsByModel.oauth),
          disagreementCount: samplePairsByModel.oauth.filter(
            (pair) => pair.primary !== pair.secondary
          ).length,
        },
        jwt: {
          observations: samplePairsByModel.jwt.length,
          kappa: cohenKappa(samplePairsByModel.jwt),
          rawAgreementRate: rawAgreementRate(samplePairsByModel.jwt),
          disagreementCount: samplePairsByModel.jwt.filter(
            (pair) => pair.primary !== pair.secondary
          ).length,
        },
        sessions: {
          observations: samplePairsByModel.sessions.length,
          kappa: cohenKappa(samplePairsByModel.sessions),
          rawAgreementRate: rawAgreementRate(samplePairsByModel.sessions),
          disagreementCount: samplePairsByModel.sessions.filter(
            (pair) => pair.primary !== pair.secondary
          ).length,
        },
      },
    },
  });
}

for (const [model, samples] of Object.entries(controlSamples)) {
  const runChecks = runners[model as keyof typeof runners];
  const runChecksSecondary = secondaryRunners[model as keyof typeof secondaryRunners];

  for (const sample of samples) {
    const checksPrimary = runChecks(sample.sourceText);
    const checksSecondary = runChecksSecondary(sample.sourceText);
    const passedPrimary = checksPrimary.every((check) => check.passed);
    const passedSecondary = checksSecondary.every((check) => check.passed);

    writeResult(`${sample.label}.json`, {
      model,
      label: sample.label,
      expectedPass: sample.expectedPass,
      actualPassPrimary: passedPrimary,
      actualPassSecondary: passedSecondary,
      matchedExpectationPrimary: sample.expectedPass === passedPrimary,
      matchedExpectationSecondary: sample.expectedPass === passedSecondary,
      checksPrimary,
      checksSecondary,
    });
  }
}

runAgreementAudit();

console.log('Validated AI heuristic controls and checker agreement.');
