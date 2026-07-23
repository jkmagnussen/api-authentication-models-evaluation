export const DOCS_DIR = "docs";
export const DOCS_GENERATED_DIR = `${DOCS_DIR}/generated`;
export const DOCS_EVIDENCE_DIR = `${DOCS_DIR}/evidence`;
export const DOCS_PERFORMANCE_DIR = `${DOCS_DIR}/performance-results`;

export const GENERATED_FILES = {
  runManifest: `${DOCS_GENERATED_DIR}/RUN_MANIFEST.json`,
  aiSummary: `${DOCS_GENERATED_DIR}/AI_EVALUATION_SUMMARY.md`,
  advancedResearchAnalysis: `${DOCS_GENERATED_DIR}/ADVANCED_SECURITY_RESEARCH_ANALYSIS.md`,
  aiProviderPromptComparison: `${DOCS_GENERATED_DIR}/AI_PROVIDER_PROMPT_COMPARISON.md`,
  aiProviderPromptComparisonBlinded: `${DOCS_GENERATED_DIR}/AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md`,
  aiBlindInterpretation: `${DOCS_GENERATED_DIR}/AI_BLIND_INTERPRETATION.md`,
  protocolSeal: `${DOCS_GENERATED_DIR}/PROTOCOL_SEAL.json`,
  powerAnalysisSeal: `${DOCS_GENERATED_DIR}/POWER_ANALYSIS_SEAL.json`,
  analysisWindow: `${DOCS_GENERATED_DIR}/ANALYSIS_WINDOW.json`,
  holdoutSeal: `${DOCS_GENERATED_DIR}/HOLDOUT_SEAL.json`,
  sentinelControls: `${DOCS_GENERATED_DIR}/SENTINEL_CONTROLS.md`,
  auditTrail: `${DOCS_GENERATED_DIR}/AUDIT_TRAIL.json`,
  objectivityAssessment: `${DOCS_GENERATED_DIR}/OBJECTIVITY_ASSESSMENT.md`,
  aiStabilityReport: `${DOCS_GENERATED_DIR}/AI_STABILITY_REPORT.md`,
  protocolDeviations: `${DOCS_GENERATED_DIR}/PROTOCOL_DEVIATIONS.md`,
  aiSampleSyntaxReport: `${DOCS_GENERATED_DIR}/AI_SAMPLE_SYNTAX_REPORT.md`,
  aiSampleSyntaxReportJson: `${DOCS_GENERATED_DIR}/ai-sample-syntax-report.json`,
  codeFootprintSummary: `${DOCS_GENERATED_DIR}/CODE_FOOTPRINT_SUMMARY.md`,
  codeFootprintJson: `${DOCS_GENERATED_DIR}/code-footprint-summary.json`,
  variantDifferential: `${DOCS_GENERATED_DIR}/VARIANT_DIFFERENTIAL_REPORT.md`,
  variantFocusedSummary: `${DOCS_GENERATED_DIR}/VARIANT_DIFFERENTIAL_REPORT.md`,
  variantFocusedJson: `${DOCS_GENERATED_DIR}/variant-focused-summary.json`,
  misconfigurationImpact: `${DOCS_GENERATED_DIR}/MISCONFIGURATION_IMPACT_MATRIX.md`,
  modelRiskSummary: `${DOCS_GENERATED_DIR}/MODEL_RISK_SUMMARY.md`,
  aiFailureTaxonomy: `${DOCS_GENERATED_DIR}/AI_FAILURE_TAXONOMY.md`,
  securityPerformanceTradeoff: `${DOCS_GENERATED_DIR}/SECURITY_PERFORMANCE_TRADEOFF.md`,
  sensitivityAnalysis: `${DOCS_GENERATED_DIR}/SENSITIVITY_ANALYSIS.md`,
  preregCompliance: `${DOCS_GENERATED_DIR}/PREREGISTERED_COMPLIANCE.md`,
};

export const PERFORMANCE_FILES = {
  analysis: `${DOCS_PERFORMANCE_DIR}/analysis.md`,
  statisticsCsv: `${DOCS_PERFORMANCE_DIR}/statistical-summary.csv`,
};

export const EXPECTED_GENERATED_DOC_FILES: string[] = [
  GENERATED_FILES.runManifest,
  GENERATED_FILES.aiSummary,
  GENERATED_FILES.advancedResearchAnalysis,
  GENERATED_FILES.aiProviderPromptComparison,
  GENERATED_FILES.aiProviderPromptComparisonBlinded,
  GENERATED_FILES.aiBlindInterpretation,
  GENERATED_FILES.protocolSeal,
  GENERATED_FILES.powerAnalysisSeal,
  GENERATED_FILES.analysisWindow,
  GENERATED_FILES.holdoutSeal,
  GENERATED_FILES.sentinelControls,
  GENERATED_FILES.auditTrail,
  GENERATED_FILES.objectivityAssessment,
  GENERATED_FILES.aiStabilityReport,
  GENERATED_FILES.protocolDeviations,
  GENERATED_FILES.aiSampleSyntaxReport,
  GENERATED_FILES.aiSampleSyntaxReportJson,
  GENERATED_FILES.codeFootprintSummary,
  GENERATED_FILES.codeFootprintJson,
  GENERATED_FILES.variantDifferential,
  GENERATED_FILES.variantFocusedJson,
  GENERATED_FILES.misconfigurationImpact,
  GENERATED_FILES.modelRiskSummary,
  GENERATED_FILES.aiFailureTaxonomy,
  GENERATED_FILES.securityPerformanceTradeoff,
  GENERATED_FILES.sensitivityAnalysis,
  GENERATED_FILES.preregCompliance,
  PERFORMANCE_FILES.analysis,
  PERFORMANCE_FILES.statisticsCsv,
];

export const DRIFT_CHECK_PATHS: string[] = [
  ...EXPECTED_GENERATED_DOC_FILES,
  "ai-generated/results/ai-samples-summary.csv",
  "ai-generated/results/ai-samples-failure-rates.csv",
];