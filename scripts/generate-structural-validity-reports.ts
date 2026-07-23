import fs from "fs";
import path from "path";
import { variantTestMap, type VariantName } from "../misconfigurations/variant-test-map";
import { GENERATED_FILES } from "./report-paths";

type Model = "oauth" | "jwt" | "sessions";

type VariantSummary = {
  variantName: VariantName;
  category: Model;
  passed: boolean;
  severityClass: string;
  severityScore: number;
  exploitabilityScore10: number;
  stride: string;
  regression: string;
};

type PerfSummaryRow = {
  model: Model;
  avgDeltaPct: number;
  throughputDeltaPct: number;
  ciLower: number | null;
  ciUpper: number | null;
  baselineOutlierCount: number;
  attackOutlierCount: number;
};

type AggregateMetric = {
  label: string;
  scope: string;
  characters: number;
  lines: number;
  cyclomaticComplexity: number;
};

type CodeFootprintJson = {
  baselineMetrics: AggregateMetric[];
};

type PropagationMeta = {
  affectedComponents: string[];
  affectedFlows: string[];
  affectedStrides: string[];
  trustBoundaryCrossings: number;
  secondaryFailures: string[];
  propagationPattern: "linear" | "fan-out" | "non-linear";
  narrative: string;
};

type ModelProfile = {
  label: string;
  configPoints: number;
  securityFlags: number;
  lifecycleSteps: number;
  trustBoundaryCrossings: number;
  validationRules: number;
  mustRememberBehaviors: number;
  propagationReading: string;
};

type BoundaryMeta = {
  primaryBoundary: string;
  attackEvidence: string[];
  structuralFailure: string;
  reading: string;
};

type ProtocolExpectation = {
  assumption: string;
  evidence: string[];
  observed: string;
  alignment: string;
};

type CognitiveVariantMeta = {
  errorMode: string;
  detectability: "Low" | "Medium" | "High";
  repairEffort: "Low" | "Medium" | "High";
  boundaryStress: string;
};

const MODEL_ORDER: Model[] = ["oauth", "jwt", "sessions"];

const MODEL_PROFILES: Record<Model, ModelProfile> = {
  oauth: {
    label: "OAuth2",
    configPoints: 8,
    securityFlags: 6,
    lifecycleSteps: 7,
    trustBoundaryCrossings: 5,
    validationRules: 7,
    mustRememberBehaviors: 6,
    propagationReading: "OAuth2 mistakes propagate non-linearly because redirect, state, code, token, and scope checks compound across multiple trust boundaries.",
  },
  jwt: {
    label: "JWT",
    configPoints: 7,
    securityFlags: 5,
    lifecycleSteps: 5,
    trustBoundaryCrossings: 3,
    validationRules: 6,
    mustRememberBehaviors: 5,
    propagationReading: "JWT mistakes tend to propagate linearly through token issuance and validation rules, especially where signature and claim checks are weakened.",
  },
  sessions: {
    label: "Session",
    configPoints: 8,
    securityFlags: 5,
    lifecycleSteps: 5,
    trustBoundaryCrossings: 3,
    validationRules: 5,
    mustRememberBehaviors: 5,
    propagationReading: "Session mistakes often amplify quickly because one cookie or invalidation weakness can spill into replay, fixation, and impersonation outcomes.",
  },
};

const BOUNDARY_ANALYSIS: Record<Model, BoundaryMeta> = {
  oauth: {
    primaryBoundary: "Redirect / authorization-code boundary",
    attackEvidence: [
      "tests/attacks/oauth/redirect.test.ts",
      "tests/attacks/oauth/state.test.ts",
      "tests/attacks/oauth/replay.test.ts",
      "tests/attacks/oauth/scope-escalation.high-impact.test.ts",
    ],
    structuralFailure: "Incorrect redirect, state, or scope handling crosses browser, client, and authorization-server boundaries before reaching the resource layer.",
    reading: "OAuth2 fails structurally at the redirect and response-binding boundaries, where a single trust-transfer error contaminates multiple downstream stages.",
  },
  jwt: {
    primaryBoundary: "Client storage / token-validation boundary",
    attackEvidence: [
      "tests/attacks/jwt/audience-issuer-mismatch.test.ts",
      "tests/attacks/jwt/claim-abuse.test.ts",
    ],
    structuralFailure: "The main structural failure occurs when untrusted tokens cross from client-controlled storage or transport into server-side validation with weakened checks.",
    reading: "JWT failures are concentrated at the token-validation boundary: fewer hops than OAuth2, but high precision stress on signature and claim discipline.",
  },
  sessions: {
    primaryBoundary: "Browser cookie / server session boundary",
    attackEvidence: [
      "tests/attacks/sessions/csrf.test.ts",
      "tests/attacks/sessions/fixation.test.ts",
      "tests/attacks/auth.security.test.ts",
    ],
    structuralFailure: "Browser-managed cookies cross into server trust with auto-send behavior, making hidden browser defaults a key structural risk surface.",
    reading: "Sessions fail structurally at the browser boundary: cookies are easy to deploy, but browser behavior can silently magnify mistakes.",
  },
};

const PROTOCOL_EXPECTATIONS: Record<Model, ProtocolExpectation[]> = {
  oauth: [
    {
      assumption: "State binding prevents authorization-response confusion.",
      evidence: ["tests/attacks/oauth/state.test.ts", "tests/attacks/oauth/replay.test.ts"],
      observed: "When state validation is weakened, authorization-code exchange succeeds under mismatched state and the flow collapses structurally.",
      alignment: "Theory matches practice only when state is implemented correctly.",
    },
    {
      assumption: "Redirect URI validation prevents code interception.",
      evidence: ["tests/attacks/oauth/redirect.test.ts"],
      observed: "Misconfigured redirect handling allows code delivery to an attacker-controlled endpoint.",
      alignment: "Empirical results strongly support the protocol assumption.",
    },
  ],
  jwt: [
    {
      assumption: "Stateless tokens reduce coordination overhead while preserving authorization if claims and signatures are verified rigorously.",
      evidence: ["tests/attacks/jwt/audience-issuer-mismatch.test.ts", "docs/performance-results/analysis.md"],
      observed: "JWT remains performance-light, but weak audience or algorithm validation creates immediate authorization failures.",
      alignment: "The scaling assumption holds, but only under precise validation discipline.",
    },
  ],
  sessions: [
    {
      assumption: "Cookie-backed sessions depend on browser constraints and revocation discipline to resist CSRF and replay.",
      evidence: ["tests/attacks/sessions/csrf.test.ts", "tests/attacks/auth.security.test.ts"],
      observed: "Session protection is robust when cookie flags and invalidation are correct, but browser-coupled mistakes expose fixation and replay paths quickly.",
      alignment: "Theory and empirical behavior align closely at the browser boundary.",
    },
  ],
};

const COGNITIVE_VARIANT_META: Record<VariantName, CognitiveVariantMeta> = {
  "oauth-redirect-misconfiguration": {
    errorMode: "Overloaded boundary mapping",
    detectability: "Medium",
    repairEffort: "High",
    boundaryStress: "Developers must coordinate client registration, redirect allowlists, and code-delivery assumptions across multiple parties.",
  },
  "oauth-state-misconfiguration": {
    errorMode: "Sequence-binding slip",
    detectability: "Low",
    repairEffort: "High",
    boundaryStress: "The state value is easy to treat as boilerplate even though it anchors the entire cross-site response flow.",
  },
  "oauth-scope-misconfiguration": {
    errorMode: "Privilege-governance overload",
    detectability: "Medium",
    repairEffort: "Medium",
    boundaryStress: "Scope semantics span client registration, token issuance, and resource-server interpretation.",
  },
  "jwt-audience-misconfiguration": {
    errorMode: "Precision validation slip",
    detectability: "Medium",
    repairEffort: "Low",
    boundaryStress: "Audience and issuer checks are compact but easy to under-specify because the happy path still appears to work.",
  },
  "jwt-algorithm-misconfiguration": {
    errorMode: "Catastrophic validation omission",
    detectability: "Low",
    repairEffort: "Medium",
    boundaryStress: "Algorithm policy sits in a small code path, but one omission undermines the entire trust decision.",
  },
  "jwt-expiry-misconfiguration": {
    errorMode: "Temporal burden underestimation",
    detectability: "Medium",
    repairEffort: "Low",
    boundaryStress: "Time-based controls appear operationally simple, but their failure surface emerges only later through replay and containment delays.",
  },
  "sessions-fixation-misconfiguration": {
    errorMode: "Lifecycle transition blind spot",
    detectability: "Low",
    repairEffort: "Medium",
    boundaryStress: "The authentication transition looks routine, so developers can forget that session rotation is a security-critical state transfer.",
  },
  "sessions-cookie-flag-misconfiguration": {
    errorMode: "Invisible browser-default risk",
    detectability: "Low",
    repairEffort: "Low",
    boundaryStress: "Browser cookie semantics are partly implicit, making missing flags cognitively easy to overlook.",
  },
  "sessions-logout-misconfiguration": {
    errorMode: "Revocation completeness blind spot",
    detectability: "Medium",
    repairEffort: "Medium",
    boundaryStress: "Logout feels like a UX action, but its server-side invalidation semantics are security-critical.",
  },
};

const PROPAGATION: Record<VariantName, PropagationMeta> = {
  "oauth-redirect-misconfiguration": {
    affectedComponents: ["redirect URI allowlist", "authorization endpoint", "authorization code store", "token issuer"],
    affectedFlows: ["client redirect validation", "authorization code delivery", "token exchange"],
    affectedStrides: ["Spoofing", "Tampering", "Elevation of Privilege"],
    trustBoundaryCrossings: 4,
    secondaryFailures: ["authorization code interception", "token theft", "unauthorized token issuance"],
    propagationPattern: "non-linear",
    narrative: "A single redirect allowlist error crosses the browser-client boundary, redirects the code to an attacker endpoint, and then contaminates the token issuance stage.",
  },
  "oauth-state-misconfiguration": {
    affectedComponents: ["state generator", "authorization response handler", "session binding", "token endpoint"],
    affectedFlows: ["state correlation", "authorization response binding", "token exchange"],
    affectedStrides: ["Tampering", "Spoofing"],
    trustBoundaryCrossings: 4,
    secondaryFailures: ["CSRF on auth response", "wrong-account binding", "session confusion"],
    propagationPattern: "non-linear",
    narrative: "State validation failure does not stop at one parameter check; it propagates into the user-session binding decision and can reassign downstream tokens to the wrong principal.",
  },
  "oauth-scope-misconfiguration": {
    affectedComponents: ["client scope policy", "authorization endpoint", "token claims builder", "resource authorization"],
    affectedFlows: ["scope negotiation", "token minting", "resource access"],
    affectedStrides: ["Elevation of Privilege", "Tampering"],
    trustBoundaryCrossings: 4,
    secondaryFailures: ["over-privileged access token", "resource overreach"],
    propagationPattern: "fan-out",
    narrative: "A scope governance error fans out from client registration into token claims and then every protected resource that trusts those claims.",
  },
  "jwt-audience-misconfiguration": {
    affectedComponents: ["audience validator", "issuer validator", "JWT middleware", "protected routes"],
    affectedFlows: ["token verification", "route authorization"],
    affectedStrides: ["Spoofing", "Elevation of Privilege"],
    trustBoundaryCrossings: 3,
    secondaryFailures: ["cross-service token reuse", "unauthorized API access"],
    propagationPattern: "linear",
    narrative: "Weak audience checks propagate almost directly from token verification into route acceptance, so the failure path is short but security-relevant.",
  },
  "jwt-algorithm-misconfiguration": {
    affectedComponents: ["algorithm allowlist", "signature verifier", "JWT middleware", "protected routes"],
    affectedFlows: ["header parsing", "signature validation", "route authorization"],
    affectedStrides: ["Spoofing", "Tampering", "Elevation of Privilege"],
    trustBoundaryCrossings: 3,
    secondaryFailures: ["token forgery", "privilege escalation", "access-control bypass"],
    propagationPattern: "linear",
    narrative: "Algorithm confusion is a classic linear cascade: forged token, accepted signature, trusted route access, then authorization bypass.",
  },
  "jwt-expiry-misconfiguration": {
    affectedComponents: ["token issuer", "expiry policy", "JWT middleware", "incident containment"],
    affectedFlows: ["token issuance", "replay window", "route authorization"],
    affectedStrides: ["Repudiation", "Spoofing"],
    trustBoundaryCrossings: 3,
    secondaryFailures: ["extended replay window", "delayed revocation effect"],
    propagationPattern: "linear",
    narrative: "Extended token lifetime enlarges the replay window and delays containment, so the propagation is temporal rather than branching.",
  },
  "sessions-fixation-misconfiguration": {
    affectedComponents: ["session ID rotation", "session store", "login flow", "protected routes"],
    affectedFlows: ["pre-auth session setup", "login transition", "authenticated session reuse"],
    affectedStrides: ["Spoofing", "Elevation of Privilege"],
    trustBoundaryCrossings: 3,
    secondaryFailures: ["session hijack", "authenticated takeover"],
    propagationPattern: "fan-out",
    narrative: "A fixation bug turns the login transition itself into the propagation point, binding the victim identity to attacker-controlled state.",
  },
  "sessions-cookie-flag-misconfiguration": {
    affectedComponents: ["cookie hardening", "browser storage", "session middleware", "protected routes"],
    affectedFlows: ["cookie issuance", "browser execution context", "session replay"],
    affectedStrides: ["Information Disclosure", "Spoofing"],
    trustBoundaryCrossings: 3,
    secondaryFailures: ["script-readable cookie", "session theft", "replay access"],
    propagationPattern: "fan-out",
    narrative: "Cookie hardening failures propagate outward because once a browser-side boundary is weakened, every subsequent session-bearing request inherits that weakness.",
  },
  "sessions-logout-misconfiguration": {
    affectedComponents: ["logout invalidation", "session store", "protected routes", "session revocation logic"],
    affectedFlows: ["logout processing", "post-logout access", "cookie replay"],
    affectedStrides: ["Spoofing", "Repudiation"],
    trustBoundaryCrossings: 3,
    secondaryFailures: ["stolen cookie replay", "unauthorized persistence"],
    propagationPattern: "fan-out",
    narrative: "Failure to invalidate the server-side session after logout turns a single missed revocation event into a continuing authenticated replay path.",
  },
};

function readVariantSummaries(): VariantSummary[] {
  const filePath = path.join(process.cwd(), GENERATED_FILES.variantFocusedJson);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as VariantSummary[];
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function readPerformanceSummary(): PerfSummaryRow[] {
  const filePath = path.join(process.cwd(), "docs", "performance-results", "statistical-summary.csv");
  const rows = fs.readFileSync(filePath, "utf8").trim().split(/\r?\n/).map(parseCsvLine);
  if (rows.length <= 1) return [];
  const header = rows[0];
  const index = new Map<string, number>();
  header.forEach((value, idx) => index.set(value, idx));
  const value = (row: string[], key: string): string => row[index.get(key) ?? -1] ?? "";

  return rows.slice(1).map((row) => ({
    model: value(row, "model") as Model,
    avgDeltaPct: Number(value(row, "avg_delta_pct")),
    throughputDeltaPct: Number(value(row, "throughput_delta_pct")),
    ciLower: value(row, "ci95_avg_delta_pct_lower") === "" ? null : Number(value(row, "ci95_avg_delta_pct_lower")),
    ciUpper: value(row, "ci95_avg_delta_pct_upper") === "" ? null : Number(value(row, "ci95_avg_delta_pct_upper")),
    baselineOutlierCount: Number(value(row, "baseline_avg_outlier_count") || "0"),
    attackOutlierCount: Number(value(row, "attack_avg_outlier_count") || "0"),
  }));
}

function readCodeFootprint(): CodeFootprintJson {
  const filePath = path.join(process.cwd(), GENERATED_FILES.codeFootprintJson);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as CodeFootprintJson;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function format(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

function primaryStrideClasses(raw: string): string[] {
  return raw
    .split("/")
    .map((value) => value.trim())
    .filter(Boolean);
}

function titleCase(value: string): string {
  return value
    .split("-")
    .map((part) => {
      if (part === "oauth") return "OAuth";
      if (part === "jwt") return "JWT";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function propagationScore(meta: PropagationMeta): number {
  const componentSpread = meta.affectedComponents.length / 4;
  const flowSpread = meta.affectedFlows.length / 3;
  const strideSpread = meta.affectedStrides.length / 3;
  const secondarySpread = meta.secondaryFailures.length / 3;
  const boundarySpread = meta.trustBoundaryCrossings / 4;

  return 10 * (
    componentSpread * 0.25 +
    flowSpread * 0.25 +
    strideSpread * 0.2 +
    secondarySpread * 0.15 +
    boundarySpread * 0.15
  );
}

function cognitiveLoadRaw(profile: ModelProfile): number {
  return (
    profile.configPoints * 1.2 +
    profile.securityFlags * 1.1 +
    profile.lifecycleSteps * 1.3 +
    profile.trustBoundaryCrossings * 1.0 +
    profile.validationRules * 1.2 +
    profile.mustRememberBehaviors * 1.4
  );
}

function attackSurfaceCompression(model: Model, variants: VariantSummary[]): number {
  const relevant = variants.filter((variant) => variant.category === model);
  const avgSeverity = average(relevant.map((variant) => variant.severityScore)) / 5;
  const avgExploitability = average(relevant.map((variant) => variant.exploitabilityScore10)) / 10;
  const strideBreadth = new Set(relevant.flatMap((variant) => primaryStrideClasses(variant.stride))).size / 3;
  const boundarySpread = MODEL_PROFILES[model].trustBoundaryCrossings / 5;

  return 10 * (
    avgSeverity * 0.35 +
    avgExploitability * 0.3 +
    strideBreadth * 0.2 +
    boundarySpread * 0.15
  );
}

function weightedExploitBurden(model: Model, variants: VariantSummary[]): number {
  const relevant = variants.filter((variant) => variant.category === model);
  return average(
    relevant.map((variant) => {
      const propagation = PROPAGATION[variant.variantName];
      return variant.severityScore * 0.45 + variant.exploitabilityScore10 * 0.25 + propagationScore(propagation) * 0.3;
    })
  );
}

function lifecycleErrorLikelihoodProxy(model: Model, variants: VariantSummary[]): number {
  const profile = MODEL_PROFILES[model];
  const burden = profile.lifecycleSteps * 1.4 + profile.mustRememberBehaviors * 1.3 + profile.trustBoundaryCrossings * 1.2;
  return burden * (1 + weightedExploitBurden(model, variants) / 20);
}

function cognitiveMisconfigurationSensitivity(variant: VariantSummary): number {
  const meta = PROPAGATION[variant.variantName];
  const cognitive = COGNITIVE_VARIANT_META[variant.variantName];
  const detectabilityPenalty = cognitive.detectability === "Low" ? 1.2 : cognitive.detectability === "Medium" ? 0.8 : 0.4;
  const repairPenalty = cognitive.repairEffort === "High" ? 1.1 : cognitive.repairEffort === "Medium" ? 0.7 : 0.4;
  return variant.severityScore * 0.4 + propagationScore(meta) * 0.35 + detectabilityPenalty + repairPenalty;
}

function cognitiveBoundaryStress(model: Model): number {
  const profile = MODEL_PROFILES[model];
  return profile.trustBoundaryCrossings * 2 + profile.mustRememberBehaviors * 1.5 + profile.securityFlags;
}

function cognitiveLifecycleBurden(model: Model): number {
  const profile = MODEL_PROFILES[model];
  return profile.lifecycleSteps * 2 + profile.validationRules * 1.4 + profile.mustRememberBehaviors * 1.3;
}

function cognitiveSecurityPostureScore(model: Model, variants: VariantSummary[]): number {
  const relevant = variants.filter((variant) => variant.category === model);
  const cli = cognitiveLoadRaw(MODEL_PROFILES[model]);
  const cms = average(relevant.map((variant) => cognitiveMisconfigurationSensitivity(variant)));
  const cbs = cognitiveBoundaryStress(model);
  const clb = cognitiveLifecycleBurden(model);
  const cep = average(relevant.map((variant) => propagationScore(PROPAGATION[variant.variantName])));
  return (cli * 0.18) + (cms * 0.24) + (cbs * 0.18) + (clb * 0.18) + (cep * 0.22);
}

function propagationShapeForModel(model: Model, variants: VariantSummary[]): string {
  const patterns = variants
    .filter((variant) => variant.category === model)
    .map((variant) => PROPAGATION[variant.variantName].propagationPattern);
  const counts = new Map<string, number>();
  for (const pattern of patterns) {
    counts.set(pattern, (counts.get(pattern) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "mixed";
}

function writeFailurePropagationAnalysis(variants: VariantSummary[]): void {
  const outputPath = path.join(process.cwd(), GENERATED_FILES.failurePropagationAnalysis);
  const lines: string[] = [];
  lines.push("# Failure Propagation Analysis");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("Regenerate: npm run analysis:structural");
  lines.push("");
  lines.push("This report models how each controlled authentication misconfiguration propagates beyond its initial defect point into downstream components, flows, and STRIDE consequences.");
  lines.push("");
  lines.push("## Cross-Model Comparison");
  lines.push("");
  lines.push("| Model | Mean Propagation Score (0-10) | Max Variant Score | Avg Components Touched | Avg Flows Touched | Avg STRIDE Breadth | Dominant Pattern |");
  lines.push("|---|---:|---:|---:|---:|---:|---|");

  for (const model of MODEL_ORDER) {
    const relevant = variants.filter((variant) => variant.category === model);
    const metas = relevant.map((variant) => PROPAGATION[variant.variantName]);
    const scores = metas.map((meta) => propagationScore(meta));
    lines.push(
      `| ${MODEL_PROFILES[model].label} | ${format(average(scores))} | ${format(Math.max(...scores))} | ${format(average(metas.map((meta) => meta.affectedComponents.length)))} | ${format(average(metas.map((meta) => meta.affectedFlows.length)))} | ${format(average(metas.map((meta) => meta.affectedStrides.length)))} | ${propagationShapeForModel(model, variants)} |`
    );
  }

  lines.push("");
  lines.push("## Propagation Graphs");
  lines.push("");

  for (const model of MODEL_ORDER) {
    const label = MODEL_PROFILES[model].label;
    lines.push(`### ${label}`);
    lines.push("");
    lines.push("```mermaid");
    lines.push("flowchart LR");

    const relevant = variants.filter((variant) => variant.category === model);
    for (const variant of relevant) {
      const meta = PROPAGATION[variant.variantName];
      const variantId = variant.variantName.replace(/[^a-zA-Z0-9]/g, "");
      lines.push(`  ${variantId}[\"${titleCase(variant.variantName)}\"]`);

      meta.affectedComponents.forEach((component, index) => {
        const componentId = `${variantId}C${index}`;
        lines.push(`  ${componentId}[\"${component}\"]`);
        lines.push(`  ${variantId} --> ${componentId}`);
      });

      meta.affectedFlows.forEach((flow, index) => {
        const flowId = `${variantId}F${index}`;
        const componentId = `${variantId}C${Math.min(index, meta.affectedComponents.length - 1)}`;
        lines.push(`  ${flowId}[\"${flow}\"]`);
        lines.push(`  ${componentId} --> ${flowId}`);
      });

      meta.affectedStrides.forEach((stride, index) => {
        const strideId = `${variantId}S${index}`;
        const flowId = `${variantId}F${Math.min(index, meta.affectedFlows.length - 1)}`;
        lines.push(`  ${strideId}[\"${stride}\"]`);
        lines.push(`  ${flowId} --> ${strideId}`);
      });
    }

    lines.push("```");
    lines.push("");
    lines.push(`- ${MODEL_PROFILES[model].propagationReading}`);
    lines.push("");
  }

  lines.push("## Variant Detail");
  lines.push("");
  lines.push("| Variant | Model | Propagation Score | Components | Flows | STRIDE Breadth | Secondary Failures | Narrative |");
  lines.push("|---|---|---:|---|---|---|---|---|");

  for (const variant of variants) {
    const meta = PROPAGATION[variant.variantName];
    lines.push(
      `| ${titleCase(variant.variantName)} | ${MODEL_PROFILES[variant.category].label} | ${format(propagationScore(meta))} | ${meta.affectedComponents.join("<br>")} | ${meta.affectedFlows.join("<br>")} | ${meta.affectedStrides.join("<br>")} | ${meta.secondaryFailures.join("<br>")} | ${meta.narrative} |`
    );
  }

  lines.push("");
  lines.push("## Interpretation");
  lines.push("");
  lines.push("- Sessions concentrate failure in fewer moving parts, but once cookie or invalidation controls fail, authenticated replay and impersonation can propagate quickly.");
  lines.push("- JWT propagation is comparatively linear: one weak validation step tends to map directly to one authorization failure path, which is easier to reason about but still severe.");
  lines.push("- OAuth2 exhibits the widest propagation graph because redirect, state, code, token, and scope flows cross more boundaries and therefore branch more aggressively when weakened.");

  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
  console.log(`Wrote ${outputPath}`);
}

function writeCognitiveLoadIndex(): void {
  const outputPath = path.join(process.cwd(), GENERATED_FILES.cognitiveLoadIndex);
  const lines: string[] = [];
  lines.push("# Cognitive Load Index");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("Regenerate: npm run analysis:structural");
  lines.push("");
  lines.push("This report estimates model-specific developer cognitive load from configuration points, lifecycle steps, trust-boundary crossings, validation rules, and must-remember security behaviors.");
  lines.push("");
  lines.push("| Model | Config Points | Security Flags | Lifecycle Steps | Trust Boundary Crossings | Validation Rules | Must-Remember Behaviors | Raw CLI | Normalized CLI (0-100) |");
  lines.push("|---|---:|---:|---:|---:|---:|---:|---:|---:|");

  const rawScores = MODEL_ORDER.map((model) => cognitiveLoadRaw(MODEL_PROFILES[model]));
  const maxRaw = Math.max(...rawScores);

  for (const model of MODEL_ORDER) {
    const profile = MODEL_PROFILES[model];
    const raw = cognitiveLoadRaw(profile);
    const normalized = maxRaw === 0 ? 0 : (raw / maxRaw) * 100;
    lines.push(
      `| ${profile.label} | ${profile.configPoints} | ${profile.securityFlags} | ${profile.lifecycleSteps} | ${profile.trustBoundaryCrossings} | ${profile.validationRules} | ${profile.mustRememberBehaviors} | ${format(raw)} | ${format(normalized)} |`
    );
  }

  lines.push("");
  lines.push("## Reading");
  lines.push("");
  lines.push("- OAuth2 carries the highest cognitive load because more moving parts must be remembered across redirect, state, PKCE, code exchange, token issuance, and scope enforcement.");
  lines.push("- JWT sits in the middle: fewer round trips than OAuth2, but key management plus signature, audience, issuer, and expiry validation still impose non-trivial mental overhead.");
  lines.push("- Sessions are operationally simpler at issue time, but correctness still depends on remembering cookie hardening, session rotation, store integrity, and revocation behavior.");
  lines.push("");
  lines.push("## Interpretation Guardrail");
  lines.push("");
  lines.push("The CLI is a developer-centric structural index, not a psychometric measurement. It is intended to compare implementation burden within this repository's controlled design, not to estimate universal human effort.");

  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
  console.log(`Wrote ${outputPath}`);
}

function writeUnifiedAttackSurfaceCompression(variants: VariantSummary[]): void {
  const outputPath = path.join(process.cwd(), GENERATED_FILES.unifiedAttackSurfaceCompression);
  const lines: string[] = [];
  lines.push("# Unified Attack Surface Compression");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("Regenerate: npm run analysis:structural");
  lines.push("");
  lines.push("This report compresses per-model STRIDE breadth, severity, exploitability, and trust-boundary breadth into a single exploratory attack-surface score for cross-model comparison.");
  lines.push("");
  lines.push("| Model | Mean Severity (1-5) | Mean Exploitability (0-10) | Unique STRIDE Classes | Trust Boundary Crossings | UASC Score (0-10) |");
  lines.push("|---|---:|---:|---:|---:|---:|");

  for (const model of MODEL_ORDER) {
    const relevant = variants.filter((variant) => variant.category === model);
    const uniqueStrides = new Set(relevant.flatMap((variant) => primaryStrideClasses(variant.stride)));
    lines.push(
      `| ${MODEL_PROFILES[model].label} | ${format(average(relevant.map((variant) => variant.severityScore)))} | ${format(average(relevant.map((variant) => variant.exploitabilityScore10)))} | ${uniqueStrides.size} | ${MODEL_PROFILES[model].trustBoundaryCrossings} | ${format(attackSurfaceCompression(model, variants))} |`
    );
  }

  lines.push("");
  lines.push("## Construction");
  lines.push("");
  lines.push("UASC uses a weighted blend of mean severity, mean exploitability, primary STRIDE breadth, and model-level trust-boundary crossings. The score is repository-scoped and should be read as a comparative compression metric, not as an absolute exposure probability.");
  lines.push("");
  lines.push("## Interpretation");
  lines.push("");
  lines.push("- OAuth2 typically scores highest because it spans more trust boundaries and distinct STRIDE failure classes than the other models.");
  lines.push("- JWT compresses to a high but more linear attack surface because fewer trust boundaries are crossed, even though signature and claim mistakes remain severe.");
  lines.push("- Sessions usually compress lower on breadth, but individual cookie and revocation weaknesses can still have strong local impact even if the overall surface is narrower.");

  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
  console.log(`Wrote ${outputPath}`);
}

function writeCrossReferenceSynthesis(variants: VariantSummary[]): void {
  const outputPath = path.join(process.cwd(), GENERATED_FILES.crossReferenceSynthesis);
  const perf = readPerformanceSummary();
  const footprint = readCodeFootprint();
  const baselineMap = new Map<Model, AggregateMetric>();

  for (const metric of footprint.baselineMetrics) {
    if (metric.label.startsWith("OAUTH")) baselineMap.set("oauth", metric);
    if (metric.label.startsWith("JWT")) baselineMap.set("jwt", metric);
    if (metric.label.startsWith("SESSIONS")) baselineMap.set("sessions", metric);
  }

  const lines: string[] = [];
  lines.push("# Cross-Reference Synthesis");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("Regenerate: npm run analysis:structural");
  lines.push("");
  lines.push("This report cross-references STRIDE, trust boundaries, lifecycle complexity, performance, empirical attack evidence, and code footprint to expose model-specific structural trade-offs.");
  lines.push("");
  lines.push("## 1) STRIDE vs Misconfiguration Variants");
  lines.push("");
  lines.push("| Variant | Model | STRIDE Classes | Propagation Pattern | Propagation Score | Structural Reading |");
  lines.push("|---|---|---|---|---:|---|");
  for (const variant of variants) {
    const meta = PROPAGATION[variant.variantName];
    lines.push(`| ${titleCase(variant.variantName)} | ${MODEL_PROFILES[variant.category].label} | ${meta.affectedStrides.join("<br>")} | ${meta.propagationPattern} | ${format(propagationScore(meta))} | ${meta.narrative} |`);
  }
  lines.push("");
  lines.push("Interpretation: OAuth2 shows the widest propagation breadth, JWT stays comparatively linear, and sessions remain narrow in scope but high-impact once browser-coupled controls fail.");
  lines.push("");
  lines.push("## 2) Trust Boundaries vs Attack Evidence");
  lines.push("");
  lines.push("| Model | Primary Boundary | Attack Evidence | Structural Failure | Boundary-Centric Reading |");
  lines.push("|---|---|---|---|---|");
  for (const model of MODEL_ORDER) {
    const meta = BOUNDARY_ANALYSIS[model];
    lines.push(`| ${MODEL_PROFILES[model].label} | ${meta.primaryBoundary} | ${meta.attackEvidence.join("<br>")} | ${meta.structuralFailure} | ${meta.reading} |`);
  }
  lines.push("");
  lines.push("## 3) Performance Overhead vs Security Resilience");
  lines.push("");
  lines.push("| Model | Avg Latency Delta % | Throughput Delta % | Weighted Exploit Burden | Pareto Reading |");
  lines.push("|---|---:|---:|---:|---|");
  for (const model of MODEL_ORDER) {
    const perfRow = perf.find((row) => row.model === model);
    const burden = weightedExploitBurden(model, variants);
    let reading = "No model dominates; trade-offs remain contextual.";
    if (model === "jwt") reading = "Fastest execution profile, but high validation fragility means small mistakes remain costly.";
    if (model === "sessions") reading = "Lower measured attack latency overhead does not imply lower structural risk; browser-coupled failures still propagate sharply.";
    if (model === "oauth") reading = "Highest boundary complexity with modest measured latency overhead, indicating structural burden is not captured by latency alone.";
    lines.push(`| ${MODEL_PROFILES[model].label} | ${format(perfRow?.avgDeltaPct ?? Number.NaN)} | ${format(perfRow?.throughputDeltaPct ?? Number.NaN)} | ${format(burden)} | ${reading} |`);
  }
  lines.push("");
  lines.push("## 4) Lifecycle Complexity vs Developer Error Likelihood");
  lines.push("");
  lines.push("| Model | Lifecycle Steps | Must-Remember Behaviors | Controlled Variant Count | Error Likelihood Proxy | Interpretation |");
  lines.push("|---|---:|---:|---:|---:|---|");
  for (const model of MODEL_ORDER) {
    const profile = MODEL_PROFILES[model];
    const count = variants.filter((variant) => variant.category === model).length;
    const proxy = lifecycleErrorLikelihoodProxy(model, variants);
    const interpretation = model === "oauth"
      ? "Most sequence-heavy model; controlled variant count is fixed, so the proxy reflects burden per step rather than raw frequency."
      : model === "jwt"
        ? "Fewer steps than OAuth2, but each validation slip has higher precision sensitivity."
        : "Simple lifecycle, but browser defaults keep the hidden-error burden meaningful.";
    lines.push(`| ${profile.label} | ${profile.lifecycleSteps} | ${profile.mustRememberBehaviors} | ${count} | ${format(proxy)} | ${interpretation} |`);
  }
  lines.push("");
  lines.push("## 5) Protocol Assumptions vs Real Attack Behaviour");
  lines.push("");
  lines.push("| Model | Protocol Assumption | Empirical Evidence | Observed Behaviour | Alignment |");
  lines.push("|---|---|---|---|---|");
  for (const model of MODEL_ORDER) {
    for (const item of PROTOCOL_EXPECTATIONS[model]) {
      lines.push(`| ${MODEL_PROFILES[model].label} | ${item.assumption} | ${item.evidence.join("<br>")} | ${item.observed} | ${item.alignment} |`);
    }
  }
  lines.push("");
  lines.push("## 6) Attack Surface vs Code Footprint");
  lines.push("");
  lines.push("| Model | Characters | Lines | Cyclomatic Complexity | UASC Score | Mean Propagation Score | Reading |");
  lines.push("|---|---:|---:|---:|---:|---:|---|");
  for (const model of MODEL_ORDER) {
    const metric = baselineMap.get(model);
    const relevant = variants.filter((variant) => variant.category === model);
    const meanPropagation = average(relevant.map((variant) => propagationScore(PROPAGATION[variant.variantName])));
    const reading = model === "oauth"
      ? "Largest baseline footprint also coincides with the broadest compressed attack surface."
      : model === "jwt"
        ? "Smaller footprint does not guarantee safety; the surface is compact but high-impact when validation is weak."
        : "Moderate footprint aligns with a narrower surface, but browser-linked failures remain operationally sharp.";
    lines.push(`| ${MODEL_PROFILES[model].label} | ${metric?.characters ?? 0} | ${metric?.lines ?? 0} | ${metric?.cyclomaticComplexity ?? 0} | ${format(attackSurfaceCompression(model, variants))} | ${format(meanPropagation)} | ${reading} |`);
  }
  lines.push("");
  lines.push("## 7) Misconfiguration Propagation vs Performance Jitter");
  lines.push("");
  lines.push("| Model | Mean Propagation Score | Attack Avg Outliers | 95% CI Width for Avg Delta % | Interpretation |");
  lines.push("|---|---:|---:|---:|---|");
  for (const model of MODEL_ORDER) {
    const relevant = variants.filter((variant) => variant.category === model);
    const meanPropagation = average(relevant.map((variant) => propagationScore(PROPAGATION[variant.variantName])));
    const perfRow = perf.find((row) => row.model === model);
    const ciWidth = perfRow && perfRow.ciLower !== null && perfRow.ciUpper !== null ? perfRow.ciUpper - perfRow.ciLower : Number.NaN;
    const interpretation = (perfRow?.attackOutlierCount ?? 0) > 0
      ? "Propagation-heavy weaknesses coincide with measurable repeated-run instability and should be interpreted conservatively."
      : "No repeated-run attack outliers flagged; structural risk here is driven more by exploitability than jitter.";
    lines.push(`| ${MODEL_PROFILES[model].label} | ${format(meanPropagation)} | ${perfRow?.attackOutlierCount ?? 0} | ${format(ciWidth)} | ${interpretation} |`);
  }

  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
  console.log(`Wrote ${outputPath}`);
}

function writeCognitiveSecurityAnalysis(variants: VariantSummary[]): void {
  const outputPath = path.join(process.cwd(), GENERATED_FILES.cognitiveSecurityAnalysis);
  const lines: string[] = [];
  lines.push("# Cognitive Security Analysis");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("Regenerate: npm run analysis:structural");
  lines.push("");
  lines.push("This report frames authentication security as a cognitive engineering problem by cross-referencing developer load, boundary stress, lifecycle burden, and cognitive error propagation.");
  lines.push("");
  lines.push("## 1) Cognitive Load Index (CLI)");
  lines.push("");
  lines.push("See docs/generated/COGNITIVE_LOAD_INDEX.md for the structural CLI table. Higher scores indicate greater developer memory and sequencing burden.");
  lines.push("");
  lines.push("## 2) Cognitive Misconfiguration Sensitivity (CMS)");
  lines.push("");
  lines.push("| Variant | Model | Error Mode | Detectability | Repair Effort | CMS Score | Reading |");
  lines.push("|---|---|---|---|---|---:|---|");
  for (const variant of variants) {
    const cognitive = COGNITIVE_VARIANT_META[variant.variantName];
    lines.push(`| ${titleCase(variant.variantName)} | ${MODEL_PROFILES[variant.category].label} | ${cognitive.errorMode} | ${cognitive.detectability} | ${cognitive.repairEffort} | ${format(cognitiveMisconfigurationSensitivity(variant))} | ${cognitive.boundaryStress} |`);
  }
  lines.push("");
  lines.push("## 3) Cognitive Boundary Stress (CBS)");
  lines.push("");
  lines.push("| Model | Trust Boundary Crossings | Must-Remember Behaviors | CBS Score | Interpretation |");
  lines.push("|---|---:|---:|---:|---|");
  for (const model of MODEL_ORDER) {
    const profile = MODEL_PROFILES[model];
    const interpretation = model === "oauth"
      ? "Highest boundary stress because client, redirect, auth-server, token, and resource-server assumptions must all line up."
      : model === "jwt"
        ? "Boundary count is lower, but validation discipline keeps stress concentrated rather than diffuse."
        : "Boundary count is moderate, yet browser-side invisibility makes the effective stress easy to underestimate.";
    lines.push(`| ${profile.label} | ${profile.trustBoundaryCrossings} | ${profile.mustRememberBehaviors} | ${format(cognitiveBoundaryStress(model))} | ${interpretation} |`);
  }
  lines.push("");
  lines.push("## 4) Cognitive Lifecycle Burden (CLB)");
  lines.push("");
  lines.push("| Model | Lifecycle Steps | Validation Rules | Must-Remember Behaviors | CLB Score | Interpretation |");
  lines.push("|---|---:|---:|---:|---:|---|");
  for (const model of MODEL_ORDER) {
    const profile = MODEL_PROFILES[model];
    lines.push(`| ${profile.label} | ${profile.lifecycleSteps} | ${profile.validationRules} | ${profile.mustRememberBehaviors} | ${format(cognitiveLifecycleBurden(model))} | ${profile.propagationReading} |`);
  }
  lines.push("");
  lines.push("## 5) Cognitive Error Propagation (CEP)");
  lines.push("");
  lines.push("| Model | Mean Propagation Score | Dominant Cognitive Slip | CEP Reading |");
  lines.push("|---|---:|---|---|");
  for (const model of MODEL_ORDER) {
    const relevant = variants.filter((variant) => variant.category === model);
    const dominant = relevant
      .map((variant) => COGNITIVE_VARIANT_META[variant.variantName].errorMode)
      .sort((a, b) => relevant.filter((variant) => COGNITIVE_VARIANT_META[variant.variantName].errorMode === b).length - relevant.filter((variant) => COGNITIVE_VARIANT_META[variant.variantName].errorMode === a).length)[0];
    lines.push(`| ${MODEL_PROFILES[model].label} | ${format(average(relevant.map((variant) => propagationScore(PROPAGATION[variant.variantName]))))} | ${dominant} | ${MODEL_PROFILES[model].propagationReading} |`);
  }
  lines.push("");
  lines.push("## 6) Cognitive Security Posture Score (CSPS)");
  lines.push("");
  lines.push("| Model | CLI Raw | Mean CMS | CBS | CLB | Mean CEP | CSPS |");
  lines.push("|---|---:|---:|---:|---:|---:|---:|");
  for (const model of MODEL_ORDER) {
    const relevant = variants.filter((variant) => variant.category === model);
    lines.push(`| ${MODEL_PROFILES[model].label} | ${format(cognitiveLoadRaw(MODEL_PROFILES[model]))} | ${format(average(relevant.map((variant) => cognitiveMisconfigurationSensitivity(variant))))} | ${format(cognitiveBoundaryStress(model))} | ${format(cognitiveLifecycleBurden(model))} | ${format(average(relevant.map((variant) => propagationScore(PROPAGATION[variant.variantName]))))} | ${format(cognitiveSecurityPostureScore(model, variants))} |`);
  }
  lines.push("");
  lines.push("## Interpretation");
  lines.push("");
  lines.push("- Authentication security is partly a cognition problem: models differ not only in protocol design, but in how much memory, sequencing, and boundary reasoning developers must sustain to keep them secure.");
  lines.push("- OAuth2 combines the highest sequence burden with the highest boundary stress, making it the most cognitively demanding model in this repository.");
  lines.push("- JWT is shorter in lifecycle length, but cognitively fragile because one precision-validation omission has system-wide consequences.");
  lines.push("- Sessions look simpler, but browser-coupled defaults create invisible risks that keep their cognitive security posture non-trivial.");

  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
  console.log(`Wrote ${outputPath}`);
}

function main(): void {
  const variants = readVariantSummaries();
  writeFailurePropagationAnalysis(variants);
  writeCognitiveLoadIndex();
  writeCrossReferenceSynthesis(variants);
  writeCognitiveSecurityAnalysis(variants);
  writeUnifiedAttackSurfaceCompression(variants);
}

main();