import fs from 'fs';
import path from 'path';

type Model = 'oauth' | 'jwt' | 'sessions';

type VariantRow = {
  variantName: string;
  category: Model;
  severityScore: number;
  exploitabilityScore10: number;
  passed: boolean;
};

type ControlDefinition = {
  controlId: string;
  model: Model;
  controlLabel: string;
  canonicalSeverity10: number;
};

type ControlRow = {
  model: Model;
  controlId: string;
  source: 'baseline' | 'misconfiguration' | 'ai';
  failureEvents: number;
  riskPer10kChars: number;
};

type ControlSummaryRow = {
  model: Model;
  source: 'baseline' | 'misconfiguration' | 'ai';
  avgRiskPer10kChars: number;
};

type SecurityControlPayload = {
  definitions: ControlDefinition[];
  rows: ControlRow[];
  modelSummary: ControlSummaryRow[];
};

type DensityRow = {
  model: Model;
  source: 'baseline' | 'misconfiguration' | 'ai';
  failuresPer10kChars: number;
  failurePointsPer10kChars: number;
};

type DensityPayload = {
  rows: DensityRow[];
};

type PerfRow = {
  model: string;
  baseline_avg_ms: string;
  attack_avg_ms: string;
};

type AiSample = {
  model: Model;
  passed: boolean;
  correctnessFailures: string;
  securityFailures: string;
};

type HistoryProvider = {
  key: string;
  overallFailureRatePct: number;
};

type HistorySnapshot = {
  providers: HistoryProvider[];
};

type MisconfigImpactRow = {
  variant: string;
  model: string;
  severityScore: number;
  remediationEffort: number;
};

const MODEL_LABEL: Record<Model, string> = {
  oauth: 'OAuth2',
  jwt: 'JWT',
  sessions: 'Session',
};

const VARIANT_TO_CONTROL_ID: Record<string, string> = {
  'oauth-redirect-misconfiguration': 'oauth_redirect_uri_validation',
  'oauth-state-misconfiguration': 'oauth_state_binding',
  'oauth-scope-misconfiguration': 'oauth_scope_enforcement',
  'jwt-audience-misconfiguration': 'jwt_audience_issuer_validation',
  'jwt-algorithm-misconfiguration': 'jwt_algorithm_allowlist',
  'jwt-expiry-misconfiguration': 'jwt_expiry_enforcement',
  'sessions-fixation-misconfiguration': 'session_regeneration_on_auth',
  'sessions-cookie-flag-misconfiguration': 'session_cookie_protection',
  'sessions-logout-misconfiguration': 'session_invalidation_on_logout',
};

const FOCAL_CONTROLS = [
  'oauth_redirect_uri_validation',
  'oauth_state_binding',
  'jwt_algorithm_allowlist',
  'session_invalidation_on_logout',
] as const;

const BOOTSTRAP_SEED = 20260723;
const BOOTSTRAP_ITERATIONS = 2000;
const FALSE_CONFIDENCE_THRESHOLDS = [0, 1, 2] as const;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function readJson<T>(relativePath: string): T {
  const full = path.join(process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(full, 'utf8')) as T;
}

function readCsv(relativePath: string): string[][] {
  const full = path.join(process.cwd(), relativePath);
  const text = fs.readFileSync(full, 'utf8').trim();
  if (!text) return [];
  return text.split(/\r?\n/).map(parseCsvLine);
}

function parseAiSamples(): AiSample[] {
  const rows = readCsv('ai-generated/results/ai-samples-summary.csv');
  if (rows.length < 2) return [];
  const header = rows[0];
  const idxModel = header.indexOf('model');
  const idxPassed = header.indexOf('passed');
  const idxCorrectness = header.indexOf('correctnessFailures');
  const idxSecurity = header.indexOf('securityFailures');

  return rows.slice(1).map((row) => ({
    model: row[idxModel] as Model,
    passed: String(row[idxPassed]).toLowerCase() === 'true',
    correctnessFailures: row[idxCorrectness] ?? '',
    securityFailures: row[idxSecurity] ?? '',
  }));
}

function splitTags(raw: string): string[] {
  return raw
    .split('|')
    .map((x) => x.trim())
    .filter((x) => x.length > 0 && x.toLowerCase() !== 'none');
}

function classifyTagToControlId(tag: string): string | undefined {
  const lower = tag.toLowerCase();
  if (lower.includes('redirect')) return 'oauth_redirect_uri_validation';
  if (/\bstate\b/.test(lower)) return 'oauth_state_binding';
  if (lower.includes('scope')) return 'oauth_scope_enforcement';
  if (lower.includes('audience') || lower.includes('issuer'))
    return 'jwt_audience_issuer_validation';
  if (lower.includes('algorithm') || lower.includes('alg') || lower.includes('signature'))
    return 'jwt_algorithm_allowlist';
  if (
    lower.includes('expiry') ||
    lower.includes('expire') ||
    lower.includes('lifetime') ||
    lower.includes('ttl')
  )
    return 'jwt_expiry_enforcement';
  if (lower.includes('regeneration') || lower.includes('fixation'))
    return 'session_regeneration_on_auth';
  if (
    lower.includes('cookie') ||
    lower.includes('httponly') ||
    lower.includes('secure') ||
    lower.includes('samesite')
  )
    return 'session_cookie_protection';
  if (lower.includes('logout') || lower.includes('invalidation') || lower.includes('replay'))
    return 'session_invalidation_on_logout';
  return undefined;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function variance(values: number[]): number {
  if (values.length <= 1) return 0;
  const m = mean(values);
  return values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
}

function stdDev(values: number[]): number {
  return Math.sqrt(variance(values));
}

function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  const t = pos - lo;
  return sorted[lo] * (1 - t) + sorted[hi] * t;
}

function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bootstrapMeanCI(
  values: number[],
  rng: () => number,
  iterations = BOOTSTRAP_ITERATIONS
): { mean: number; lower: number; upper: number } {
  if (values.length === 0) return { mean: 0, lower: 0, upper: 0 };
  const n = values.length;
  const means: number[] = [];

  for (let i = 0; i < iterations; i += 1) {
    let s = 0;
    for (let j = 0; j < n; j += 1) {
      const pick = Math.floor(rng() * n);
      s += values[pick];
    }
    means.push(s / n);
  }

  return {
    mean: mean(values),
    lower: quantile(means, 0.025),
    upper: quantile(means, 0.975),
  };
}

function parseMisconfigImpact(): MisconfigImpactRow[] {
  const lines = fs
    .readFileSync(
      path.join(process.cwd(), 'docs/generated/MISCONFIGURATION_IMPACT_MATRIX.md'),
      'utf8'
    )
    .split(/\r?\n/)
    .filter((line) => line.startsWith('| '));

  if (lines.length < 3) return [];

  const body = lines.slice(2);
  const rows: MisconfigImpactRow[] = [];
  for (const line of body) {
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

    const variant = cells[0] ?? '';
    const model = (cells[1] ?? '').toLowerCase();
    const severityCell = cells[2] ?? '';
    const remediationCell = cells[5] ?? '';

    const severityMatch = severityCell.match(/\((\d+)\)/);
    const severityScore = severityMatch ? Number(severityMatch[1]) : 0;
    const remediationEffort = Number(remediationCell) || 0;

    rows.push({ variant, model, severityScore, remediationEffort });
  }

  return rows;
}

function fmt(n: number, digits = 3): string {
  return Number.isFinite(n) ? n.toFixed(digits) : '0.000';
}

function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function resolveGeneratedAt(): string {
  if (process.env.REPRO_MODE === '1') {
    return process.env.REPRO_TIMESTAMP ?? '1970-01-01T00:00:00.000Z';
  }
  return new Date().toISOString();
}

function computeFalseConfidenceRate(aiSamples: AiSample[], threshold: number) {
  let falseConfidenceSamples = 0;
  for (const sample of aiSamples) {
    const correctnessCount = splitTags(sample.correctnessFailures).length;
    const securityCount = splitTags(sample.securityFailures).length;
    if (correctnessCount <= threshold && securityCount > 0) {
      falseConfidenceSamples += 1;
    }
  }

  const totalSamples = aiSamples.length;
  return {
    threshold,
    falseConfidenceSamples,
    totalSamples,
    rate: totalSamples > 0 ? falseConfidenceSamples / totalSamples : 0,
  };
}

function main() {
  const variants = readJson<VariantRow[]>('docs/generated/variant-focused-summary.json');
  const control = readJson<SecurityControlPayload>('docs/generated/security-control-points.json');
  const density = readJson<DensityPayload>('docs/generated/normalized-failure-density.json');
  const aiSamples = parseAiSamples();
  const perfCsv = readCsv('docs/performance-results/statistical-summary.csv');
  const historyDir = path.join(process.cwd(), 'ai-generated/arms/history');
  const misconfigImpact = parseMisconfigImpact();

  const controlSeverity = new Map<string, number>();
  const controlModel = new Map<string, Model>();
  for (const def of control.definitions) {
    controlSeverity.set(def.controlId, def.canonicalSeverity10);
    controlModel.set(def.controlId, def.model);
  }

  const controlRiskPerSampleByModel: Record<Model, number[]> = {
    oauth: [],
    jwt: [],
    sessions: [],
  };

  const controlFailCountByModelControl: Record<Model, Record<string, number>> = {
    oauth: {},
    jwt: {},
    sessions: {},
  };

  for (const sample of aiSamples) {
    const mapped = new Set(
      splitTags(sample.securityFailures)
        .map(classifyTagToControlId)
        .filter((id): id is string => Boolean(id))
    );

    let sampleRisk = 0;
    for (const controlId of mapped) {
      const sev = controlSeverity.get(controlId) ?? 0;
      sampleRisk += sev;
      const bucket = controlFailCountByModelControl[sample.model];
      bucket[controlId] = (bucket[controlId] ?? 0) + 1;
    }

    controlRiskPerSampleByModel[sample.model].push(sampleRisk);
  }

  const baselineSampleRiskByModel: Record<Model, number[]> = {
    oauth: [],
    jwt: [],
    sessions: [],
  };

  // Compute baseline sample risk from data instead of hardcoding.
  // Assumption: baseline represents one curated reference implementation per model.
  for (const model of Object.keys(MODEL_LABEL) as Model[]) {
    const baselineRows = control.rows.filter(
      (row) => row.model === model && row.source === 'baseline'
    );
    const weightedRiskTotal = baselineRows.reduce((sum, row) => {
      const severity = controlSeverity.get(row.controlId) ?? 0;
      return sum + row.failureEvents * severity;
    }, 0);
    baselineSampleRiskByModel[model] = [weightedRiskTotal];
  }

  const bootstrapRng = createSeededRng(BOOTSTRAP_SEED);
  const severityGap = (Object.keys(MODEL_LABEL) as Model[]).map((model) => {
    const aiCi = bootstrapMeanCI(
      controlRiskPerSampleByModel[model],
      bootstrapRng,
      BOOTSTRAP_ITERATIONS
    );
    const baselineMean = mean(baselineSampleRiskByModel[model]);
    return {
      model,
      modelLabel: MODEL_LABEL[model],
      baselineMeanRiskPerSample: baselineMean,
      aiMeanRiskPerSample: aiCi.mean,
      deltaAiMinusBaseline: aiCi.mean - baselineMean,
      ci95Lower: aiCi.lower - baselineMean,
      ci95Upper: aiCi.upper - baselineMean,
    };
  });

  const totalSamplesByModel: Record<Model, number> = { oauth: 0, jwt: 0, sessions: 0 };
  for (const sample of aiSamples) {
    totalSamplesByModel[sample.model] += 1;
  }

  const baselineControlFailureCount = new Map<string, number>();
  for (const row of control.rows) {
    if (row.source === 'baseline') {
      baselineControlFailureCount.set(row.controlId, row.failureEvents);
    }
  }

  const controlCoverageAll = control.definitions.map((definition) => {
    const model = definition.model;
    const aiFails = controlFailCountByModelControl[model][definition.controlId] ?? 0;
    const aiTotal = totalSamplesByModel[model] || 1;
    const baselineFails = baselineControlFailureCount.get(definition.controlId) ?? 0;
    const baselineTotal = 1;
    const baselinePassRate = 1 - baselineFails / baselineTotal;

    return {
      controlId: definition.controlId,
      controlLabel: definition.controlLabel,
      model,
      baselinePassRate,
      aiPassRate: 1 - aiFails / aiTotal,
      aiFailureRate: aiFails / aiTotal,
    };
  });

  const controlCoverageFocal = controlCoverageAll.filter((row) =>
    FOCAL_CONTROLS.includes(row.controlId as (typeof FOCAL_CONTROLS)[number])
  );

  const falseConfidenceSensitivity = FALSE_CONFIDENCE_THRESHOLDS.map((threshold) =>
    computeFalseConfidenceRate(aiSamples, threshold)
  );
  const primaryFalseConfidence =
    falseConfidenceSensitivity.find((x) => x.threshold === 1) ??
    computeFalseConfidenceRate(aiSamples, 1);

  const historySnapshots: HistorySnapshot[] = [];
  if (fs.existsSync(historyDir)) {
    for (const name of fs.readdirSync(historyDir)) {
      if (!name.endsWith('.json')) continue;
      const snapshot = JSON.parse(
        fs.readFileSync(path.join(historyDir, name), 'utf8')
      ) as HistorySnapshot;
      historySnapshots.push(snapshot);
    }
  }

  const armRates: Record<string, number[]> = {};
  for (const snap of historySnapshots) {
    for (const p of snap.providers ?? []) {
      if (!armRates[p.key]) armRates[p.key] = [];
      armRates[p.key].push(p.overallFailureRatePct);
    }
  }

  const armStability = Object.keys(armRates)
    .sort()
    .map((key) => ({
      arm: key,
      cohorts: armRates[key].length,
      meanFailurePct: mean(armRates[key]),
      stdDevFailurePct: stdDev(armRates[key]),
      spreadPct: Math.max(...armRates[key]) - Math.min(...armRates[key]),
    }));

  const aiRiskPer10kByModel = (Object.keys(MODEL_LABEL) as Model[]).map((model) => {
    const row = control.modelSummary.find((r) => r.model === model && r.source === 'ai');
    return row?.avgRiskPer10kChars ?? 0;
  });

  const baselineRiskPer10kByModel = (Object.keys(MODEL_LABEL) as Model[]).map((model) => {
    const row = control.modelSummary.find((r) => r.model === model && r.source === 'baseline');
    return row?.avgRiskPer10kChars ?? 0;
  });

  const safetyStability = {
    baselineRiskPer10kVarianceAcrossModels: variance(baselineRiskPer10kByModel),
    aiRiskPer10kVarianceAcrossModels: variance(aiRiskPer10kByModel),
    armFailureRateStdDevMean: mean(armStability.map((r) => r.stdDevFailurePct)),
  };

  const perfHeader = perfCsv[0] ?? [];
  const perfBody = perfCsv.slice(1);
  const perfRows: PerfRow[] = perfBody.map((row) => ({
    model: row[perfHeader.indexOf('model')],
    baseline_avg_ms: row[perfHeader.indexOf('baseline_avg_ms')],
    attack_avg_ms: row[perfHeader.indexOf('attack_avg_ms')],
  }));

  const dominance = (Object.keys(MODEL_LABEL) as Model[]).map((model) => {
    const baseDensity = density.rows.find((r) => r.model === model && r.source === 'baseline');
    const aiDensity = density.rows.find((r) => r.model === model && r.source === 'ai');
    const baseControl = control.modelSummary.find(
      (r) => r.model === model && r.source === 'baseline'
    );
    const aiControl = control.modelSummary.find((r) => r.model === model && r.source === 'ai');

    const criteria = [
      (baseDensity?.failuresPer10kChars ?? 0) < (aiDensity?.failuresPer10kChars ?? 0),
      (baseDensity?.failurePointsPer10kChars ?? 0) < (aiDensity?.failurePointsPer10kChars ?? 0),
      (baseControl?.avgRiskPer10kChars ?? 0) < (aiControl?.avgRiskPer10kChars ?? 0),
    ];

    const wins = criteria.filter(Boolean).length;
    const losses = criteria.length - wins;
    return {
      model,
      modelLabel: MODEL_LABEL[model],
      criteriaCount: criteria.length,
      baselineWins: wins,
      baselineLosses: losses,
      baselineDominates: wins === criteria.length,
    };
  });

  const remediationByControl = new Map<string, { severity: number; effort: number }>();
  for (const variant of variants) {
    const controlId = VARIANT_TO_CONTROL_ID[variant.variantName];
    if (!controlId) continue;

    const impact = misconfigImpact.find((row) => row.variant === variant.variantName);
    remediationByControl.set(controlId, {
      severity: impact?.severityScore ?? variant.severityScore ?? 0,
      effort: impact?.remediationEffort ?? 0,
    });
  }

  const remediationScores = (Object.keys(MODEL_LABEL) as Model[]).map((model) => {
    const total = totalSamplesByModel[model] || 1;
    let expectedScore = 0;

    for (const [controlId, count] of Object.entries(controlFailCountByModelControl[model])) {
      const info = remediationByControl.get(controlId);
      if (!info) continue;
      const frequency = count / total;
      expectedScore += frequency * info.severity * info.effort;
    }

    return {
      model,
      modelLabel: MODEL_LABEL[model],
      baselineExpectedScore: 0,
      aiExpectedScore: expectedScore,
      deltaAiMinusBaseline: expectedScore,
    };
  });

  const robustness = (Object.keys(MODEL_LABEL) as Model[]).map((model) => {
    const baseDensity = density.rows.find((r) => r.model === model && r.source === 'baseline');
    const misDensity = density.rows.find(
      (r) => r.model === model && r.source === 'misconfiguration'
    );
    const aiDensity = density.rows.find((r) => r.model === model && r.source === 'ai');

    const baseControl = control.modelSummary.find(
      (r) => r.model === model && r.source === 'baseline'
    );
    const misControl = control.modelSummary.find(
      (r) => r.model === model && r.source === 'misconfiguration'
    );
    const aiControl = control.modelSummary.find((r) => r.model === model && r.source === 'ai');

    const misDeltaFailure =
      (misDensity?.failuresPer10kChars ?? 0) - (baseDensity?.failuresPer10kChars ?? 0);
    const aiDeltaFailure =
      (aiDensity?.failuresPer10kChars ?? 0) - (baseDensity?.failuresPer10kChars ?? 0);
    const ratioFailure = misDeltaFailure > 0 ? aiDeltaFailure / misDeltaFailure : 0;

    const misDeltaRisk =
      (misControl?.avgRiskPer10kChars ?? 0) - (baseControl?.avgRiskPer10kChars ?? 0);
    const aiDeltaRisk =
      (aiControl?.avgRiskPer10kChars ?? 0) - (baseControl?.avgRiskPer10kChars ?? 0);
    const ratioRisk = misDeltaRisk > 0 ? aiDeltaRisk / misDeltaRisk : 0;

    return {
      model,
      modelLabel: MODEL_LABEL[model],
      failureDegradationRatioAiToMisconfig: ratioFailure,
      riskDegradationRatioAiToMisconfig: ratioRisk,
    };
  });

  const greenComputing = (Object.keys(MODEL_LABEL) as Model[]).map((model) => {
    const perf = perfRows.find((r) => r.model.toLowerCase() === model);
    const attackMs = Number(perf?.attack_avg_ms ?? 0);

    const modelSamples = aiSamples.filter((s) => s.model === model);
    const successRate =
      modelSamples.length > 0
        ? modelSamples.filter((s) => s.passed).length / modelSamples.length
        : 0;

    const baselineComputePerSecureOutcome = attackMs;
    const aiComputePerSecureOutcome =
      successRate > 0 ? attackMs / successRate : Number.POSITIVE_INFINITY;

    return {
      model,
      modelLabel: MODEL_LABEL[model],
      attackAvgMsProxy: attackMs,
      baselineSecureSuccessRate: 1,
      aiSecureSuccessRate: successRate,
      baselineComputePerSecureOutcome,
      aiComputePerSecureOutcome,
      aiComputePerSecureOutcomeMultiplierVsBaseline:
        baselineComputePerSecureOutcome > 0
          ? aiComputePerSecureOutcome / baselineComputePerSecureOutcome
          : 0,
    };
  });

  const output = {
    generatedAt: resolveGeneratedAt(),
    methodology: {
      bootstrapSeed: BOOTSTRAP_SEED,
      bootstrapIterations: BOOTSTRAP_ITERATIONS,
      falseConfidenceThresholds: FALSE_CONFIDENCE_THRESHOLDS,
      baselineSampleAssumption: 'One curated baseline implementation per model.',
      greenProxyAssumption:
        'Attack-phase average latency is used as a compute-per-secure-outcome proxy; this is not direct energy metering.',
    },
    severityWeightedSafetyGapWithUncertainty: severityGap,
    focalControlSelectionRationale:
      'Focal controls were preselected as high-impact sentinel controls; full-control coverage is also reported for sensitivity against control-selection bias.',
    focalControlCoverageReliability: controlCoverageFocal,
    controlCoverageReliabilityFull: controlCoverageAll,
    falseConfidenceRate: {
      lowCorrectnessThreshold: primaryFalseConfidence.threshold,
      falseConfidenceSamples: primaryFalseConfidence.falseConfidenceSamples,
      totalSamples: primaryFalseConfidence.totalSamples,
      rate: primaryFalseConfidence.rate,
    },
    falseConfidenceSensitivity,
    safetyStabilityComparison: {
      armHistoryStability: armStability,
      aggregate: safetyStability,
    },
    dominanceScoreAcrossCoreMetrics: dominance,
    costOfRemediationProxy: remediationScores,
    robustnessUnderAdversarialPerturbation: robustness,
    greenComputingComparison: greenComputing,
  };

  const jsonPath = path.join(process.cwd(), 'docs/generated/ai-vs-human-advanced-comparisons.json');
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));

  const md: string[] = [];
  md.push('# AI vs Human Advanced Objective Comparisons');
  md.push('');
  md.push(`Generated: ${output.generatedAt}`);
  md.push('Regenerate: npm run decision:ai-vs-human:advanced');
  md.push('');

  md.push('## 1) Severity-Weighted Safety Gap with Uncertainty');
  md.push('');
  md.push(
    '| Model | Baseline Mean Risk/Sample | AI Mean Risk/Sample | Delta (AI-Baseline) | 95% CI Lower | 95% CI Upper |'
  );
  md.push('|---|---:|---:|---:|---:|---:|');
  for (const row of severityGap) {
    md.push(
      `| ${row.modelLabel} | ${fmt(row.baselineMeanRiskPerSample)} | ${fmt(row.aiMeanRiskPerSample)} | ${fmt(row.deltaAiMinusBaseline)} | ${fmt(row.ci95Lower)} | ${fmt(row.ci95Upper)} |`
    );
  }
  md.push('');

  md.push('## 2) Control Coverage Reliability');
  md.push('');
  md.push('Focal-control view (sentinel controls preselected for high security impact):');
  md.push('');
  md.push('| Control ID | Model | Baseline Pass Rate | AI Pass Rate | AI Failure Rate |');
  md.push('|---|---|---:|---:|---:|');
  for (const row of controlCoverageFocal) {
    md.push(
      `| ${row.controlId} | ${row.model} | ${pct((row.baselinePassRate ?? 0) * 100)} | ${pct((row.aiPassRate ?? 0) * 100)} | ${pct((row.aiFailureRate ?? 0) * 100)} |`
    );
  }
  md.push('');
  md.push('Full-control sensitivity view (all defined control points):');
  md.push('');
  md.push(
    '| Control ID | Control Label | Model | Baseline Pass Rate | AI Pass Rate | AI Failure Rate |'
  );
  md.push('|---|---|---|---:|---:|---:|');
  for (const row of controlCoverageAll) {
    md.push(
      `| ${row.controlId} | ${row.controlLabel} | ${row.model} | ${pct((row.baselinePassRate ?? 0) * 100)} | ${pct((row.aiPassRate ?? 0) * 100)} | ${pct((row.aiFailureRate ?? 0) * 100)} |`
    );
  }
  md.push('');
  md.push(`- Focal control rationale: ${output.focalControlSelectionRationale}`);
  md.push('');

  md.push('## 3) False-Confidence Rate');
  md.push('');
  md.push(
    `- Primary threshold: correctness failure count <= ${output.falseConfidenceRate.lowCorrectnessThreshold}`
  );
  md.push(
    `- False-confidence samples: ${output.falseConfidenceRate.falseConfidenceSamples}/${output.falseConfidenceRate.totalSamples} (${pct(output.falseConfidenceRate.rate * 100)})`
  );
  md.push('');
  md.push('Sensitivity across thresholds:');
  md.push('');
  md.push('| Correctness Threshold | False-Confidence Samples | Total Samples | Rate |');
  md.push('|---:|---:|---:|---:|');
  for (const row of falseConfidenceSensitivity) {
    md.push(
      `| ${row.threshold} | ${row.falseConfidenceSamples} | ${row.totalSamples} | ${pct(row.rate * 100)} |`
    );
  }
  md.push('');

  md.push('## 4) Safety Stability Comparison');
  md.push('');
  md.push('### Arm History Stability');
  md.push('');
  md.push('| Arm | Cohorts | Mean Failure % | Std Dev | Spread |');
  md.push('|---|---:|---:|---:|---:|');
  for (const row of armStability) {
    md.push(
      `| ${row.arm} | ${row.cohorts} | ${fmt(row.meanFailurePct)} | ${fmt(row.stdDevFailurePct)} | ${fmt(row.spreadPct)} |`
    );
  }
  md.push('');
  md.push(
    `- Baseline risk variance across models: ${fmt(safetyStability.baselineRiskPer10kVarianceAcrossModels)}`
  );
  md.push(
    `- AI risk variance across models: ${fmt(safetyStability.aiRiskPer10kVarianceAcrossModels)}`
  );
  md.push(`- Mean arm failure-rate std dev: ${fmt(safetyStability.armFailureRateStdDevMean)}`);
  md.push('');

  md.push('## 5) Dominance Score Across Core Metrics');
  md.push('');
  md.push('| Model | Criteria Count | Baseline Wins | Baseline Losses | Baseline Dominates |');
  md.push('|---|---:|---:|---:|---|');
  for (const row of dominance) {
    md.push(
      `| ${row.modelLabel} | ${row.criteriaCount} | ${row.baselineWins} | ${row.baselineLosses} | ${row.baselineDominates ? 'Yes' : 'No'} |`
    );
  }
  md.push('');

  md.push('## 6) Cost-of-Remediation Proxy');
  md.push('');
  md.push('| Model | Baseline Expected Score | AI Expected Score | Delta (AI-Baseline) |');
  md.push('|---|---:|---:|---:|');
  for (const row of remediationScores) {
    md.push(
      `| ${row.modelLabel} | ${fmt(row.baselineExpectedScore)} | ${fmt(row.aiExpectedScore)} | ${fmt(row.deltaAiMinusBaseline)} |`
    );
  }
  md.push('');

  md.push('## 7) Robustness Under Adversarial Perturbation');
  md.push('');
  md.push(
    '| Model | Failure Degradation Ratio (AI/Misconfig) | Risk Degradation Ratio (AI/Misconfig) |'
  );
  md.push('|---|---:|---:|');
  for (const row of robustness) {
    md.push(
      `| ${row.modelLabel} | ${fmt(row.failureDegradationRatioAiToMisconfig)} | ${fmt(row.riskDegradationRatioAiToMisconfig)} |`
    );
  }
  md.push('');

  md.push('## 8) Green Computing Proxy Comparison');
  md.push('');
  md.push(
    '| Model | Attack Avg ms (Proxy) | Baseline Secure Success Rate | AI Secure Success Rate | Baseline Compute/Secure Outcome | AI Compute/Secure Outcome | AI Compute Multiplier |'
  );
  md.push('|---|---:|---:|---:|---:|---:|---:|');
  for (const row of greenComputing) {
    md.push(
      `| ${row.modelLabel} | ${fmt(row.attackAvgMsProxy)} | ${fmt(row.baselineSecureSuccessRate)} | ${fmt(row.aiSecureSuccessRate)} | ${fmt(row.baselineComputePerSecureOutcome)} | ${fmt(row.aiComputePerSecureOutcome)} | ${fmt(row.aiComputePerSecureOutcomeMultiplierVsBaseline)} |`
    );
  }
  md.push('');
  md.push('## Notes');
  md.push('');
  md.push(
    '- Baseline rows represent the curated human-authored reference implementation under this protocol.'
  );
  md.push(
    '- These are objective comparisons from current generated artifacts; interpretation remains repository- and protocol-scoped.'
  );
  md.push('');
  md.push('## 9) Methodological Limits and External Validity');
  md.push('');
  md.push(
    '- Confidence intervals use bootstrap resampling with a fixed seed for reproducibility, but still reflect the limits of finite sample size.'
  );
  md.push(
    '- Baseline sample risk is computed from the baseline control-event data under the one-reference-implementation-per-model assumption.'
  );
  md.push(
    '- Focal control coverage is a sentinel subset; full-control coverage is included to reduce selection-bias risk.'
  );
  md.push(
    '- False-confidence rate depends on threshold choice; sensitivity across thresholds is reported and should be cited.'
  );
  md.push(
    '- Green-computing values are compute proxies derived from attack-phase latency and secure-success rates, not direct watt-hour measurements.'
  );
  md.push(
    '- Findings are repository- and protocol-scoped and should not be generalized to all models or domains without replication.'
  );

  const mdPath = path.join(process.cwd(), 'docs/generated/AI_VS_HUMAN_ADVANCED_COMPARISONS.md');
  fs.writeFileSync(mdPath, `${md.join('\n')}\n`);

  console.log('Wrote docs/generated/AI_VS_HUMAN_ADVANCED_COMPARISONS.md');
  console.log('Wrote docs/generated/ai-vs-human-advanced-comparisons.json');
}

main();
