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

function main(): void {
  const variants = readVariantSummaries();
  writeFailurePropagationAnalysis(variants);
  writeCognitiveLoadIndex();
  writeUnifiedAttackSurfaceCompression(variants);
}

main();