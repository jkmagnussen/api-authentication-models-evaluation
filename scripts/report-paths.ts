export const DOCS_DIR = "docs";
export const DOCS_GENERATED_DIR = `${DOCS_DIR}/generated`;
export const DOCS_EVIDENCE_DIR = `${DOCS_DIR}/evidence`;
export const DOCS_PERFORMANCE_DIR = `${DOCS_DIR}/performance-results`;

export const GENERATED_FILES = {
  aiSummary: `${DOCS_GENERATED_DIR}/AI_EVALUATION_SUMMARY.md`,
  codeFootprintSummary: `${DOCS_GENERATED_DIR}/CODE_FOOTPRINT_SUMMARY.md`,
  codeFootprintJson: `${DOCS_GENERATED_DIR}/code-footprint-summary.json`,
  variantDifferential: `${DOCS_GENERATED_DIR}/VARIANT_DIFFERENTIAL_REPORT.md`,
  variantFocusedSummary: `${DOCS_GENERATED_DIR}/VARIANT_FOCUSED_SUMMARY.md`,
  variantFocusedJson: `${DOCS_GENERATED_DIR}/variant-focused-summary.json`,
  misconfigurationImpact: `${DOCS_GENERATED_DIR}/MISCONFIGURATION_IMPACT_MATRIX.md`,
  modelRiskSummary: `${DOCS_GENERATED_DIR}/MODEL_RISK_SUMMARY.md`,
  aiFailureTaxonomy: `${DOCS_GENERATED_DIR}/AI_FAILURE_TAXONOMY.md`,
  securityPerformanceTradeoff: `${DOCS_GENERATED_DIR}/SECURITY_PERFORMANCE_TRADEOFF.md`,
};

export const PERFORMANCE_FILES = {
  analysis: `${DOCS_PERFORMANCE_DIR}/analysis.md`,
  statisticsCsv: `${DOCS_PERFORMANCE_DIR}/statistical-summary.csv`,
};

export const EXPECTED_GENERATED_DOC_FILES: string[] = [
  GENERATED_FILES.aiSummary,
  GENERATED_FILES.codeFootprintSummary,
  GENERATED_FILES.codeFootprintJson,
  GENERATED_FILES.variantDifferential,
  GENERATED_FILES.variantFocusedSummary,
  GENERATED_FILES.variantFocusedJson,
  GENERATED_FILES.misconfigurationImpact,
  GENERATED_FILES.modelRiskSummary,
  GENERATED_FILES.aiFailureTaxonomy,
  GENERATED_FILES.securityPerformanceTradeoff,
  PERFORMANCE_FILES.analysis,
  PERFORMANCE_FILES.statisticsCsv,
  `${DOCS_DIR}/REPO_QUICK_GUIDE.pdf`,
];

export const DRIFT_CHECK_PATHS: string[] = [
  ...EXPECTED_GENERATED_DOC_FILES,
  "ai-generated/results/ai-samples-summary.csv",
  "ai-generated/results/ai-samples-failure-rates.csv",
];