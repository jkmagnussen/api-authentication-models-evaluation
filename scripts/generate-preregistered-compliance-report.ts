import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { GENERATED_FILES } from './report-paths';

type RunSummary = {
  allowPartial?: boolean;
  requiredArms?: string[];
  providers?: Array<{ key: string; status: 'completed' | 'skipped' | 'failed'; reason?: string }>;
};

type RunManifest = {
  methodology?: {
    governance?: {
      mode?: 'confirmatory' | 'exploratory';
      claimClass?: 'governed-confirmatory' | 'exploratory-author-interpreted';
      blindInterpretationStatus?: 'finalized-pre-unblind' | 'draft-needs-finalization' | 'unknown';
      reviewerFinalizationComplete?: boolean;
    };
    runNormalization?: {
      dependencyLockFilePresent?: boolean;
      dependencyLockSha256?: string | null;
    };
    aiMatrix?: {
      arms?: Array<{ key: string; status: 'completed' | 'skipped' | 'failed' }>;
      armCompleteness?: {
        allCompletedArmsHaveProviderName?: boolean;
        allCompletedArmsHaveProviderModelIdentifier?: boolean;
        allCompletedArmsHaveSystemPromptFingerprint?: boolean;
        allCompletedArmsHaveGenerationParameters?: boolean;
        allCompletedArmsHaveRetryPolicy?: boolean;
      };
    };
  };
};

type HistorySnapshot = {
  generatedAt?: string;
  providers?: Array<{ key: string; status: 'completed' | 'skipped' | 'failed' }>;
};

type AnalysisWindow = {
  lockedAt?: string;
  frozenHistoryMaxGeneratedAt?: string | null;
};

type HoldoutSeal = {
  holdoutDefinitionPath?: string;
  holdoutDefinitionSha256?: string;
};

type ProtocolSeal = {
  protocolDocumentPath?: string;
  protocolDocumentSha256?: string;
};

type PowerAnalysisSeal = {
  rationalePath?: string;
  rationaleSha256?: string;
};

type AuditTrail = {
  signatureSha256?: string;
  entries?: Array<{
    label?: string;
    path?: string;
    sha256?: string;
  }>;
};

function loadHistorySnapshots(historyDir: string): HistorySnapshot[] {
  if (!fs.existsSync(historyDir)) return [];
  const files = fs
    .readdirSync(historyDir)
    .filter((file) => file.endsWith('.json'))
    .sort();

  const snapshots: HistorySnapshot[] = [];
  for (const fileName of files) {
    const filePath = path.join(historyDir, fileName);
    try {
      snapshots.push(JSON.parse(fs.readFileSync(filePath, 'utf8')) as HistorySnapshot);
    } catch {
      // Ignore malformed snapshots.
    }
  }
  return snapshots;
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function main(): void {
  const root = process.cwd();
  const runSummaryPath = path.join(root, 'ai-generated', 'arms', 'run-summary.json');
  const objectivityPath = path.join(root, GENERATED_FILES.objectivityAssessment);

  const lines: string[] = [];
  lines.push('# Pre-Registered Compliance Summary');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('Regenerate: npm run objective:preregistered:report');
  lines.push('');

  let summary: RunSummary | null = null;
  if (fs.existsSync(runSummaryPath)) {
    summary = JSON.parse(fs.readFileSync(runSummaryPath, 'utf8')) as RunSummary;
  }

  const requiredArms = summary?.requiredArms?.length ?? summary?.providers?.length ?? 0;
  const completedArms = (summary?.providers ?? []).filter(
    (entry) => entry.status === 'completed'
  ).length;
  const fullCoverage = requiredArms > 0 && completedArms === requiredArms;

  const objectivityText = fs.existsSync(objectivityPath)
    ? fs.readFileSync(objectivityPath, 'utf8')
    : '';
  const hasCoverageCompleteLine = objectivityText.includes('Coverage status: Complete');
  const protocolSourcePath = path.join(root, GENERATED_FILES.runManifest);
  const protocolSourceText = fs.existsSync(protocolSourcePath)
    ? fs.readFileSync(protocolSourcePath, 'utf8')
    : '';
  const protocolSealPath = path.join(root, GENERATED_FILES.protocolSeal);
  const protocolSeal = fs.existsSync(protocolSealPath)
    ? (JSON.parse(fs.readFileSync(protocolSealPath, 'utf8')) as ProtocolSeal)
    : null;
  const protocolSealValid =
    !!protocolSeal &&
    protocolSeal.protocolDocumentPath === GENERATED_FILES.runManifest &&
    !!protocolSeal.protocolDocumentSha256 &&
    protocolSeal.protocolDocumentSha256 === sha256(protocolSourceText);
  const powerAnalysisPath = path.join(root, GENERATED_FILES.sensitivityAnalysis);
  const powerAnalysisSealPath = path.join(root, GENERATED_FILES.powerAnalysisSeal);
  const powerAnalysisSeal = fs.existsSync(powerAnalysisSealPath)
    ? (JSON.parse(fs.readFileSync(powerAnalysisSealPath, 'utf8')) as PowerAnalysisSeal)
    : null;
  const powerAnalysisValid =
    !!powerAnalysisSeal &&
    powerAnalysisSeal.rationalePath === GENERATED_FILES.sensitivityAnalysis &&
    !!powerAnalysisSeal.rationaleSha256 &&
    fs.existsSync(powerAnalysisPath) &&
    powerAnalysisSeal.rationaleSha256 === sha256(fs.readFileSync(powerAnalysisPath, 'utf8'));
  const blindedReportPath = path.join(root, GENERATED_FILES.aiProviderPromptComparisonBlinded);
  const blindedReportText = fs.existsSync(blindedReportPath)
    ? fs.readFileSync(blindedReportPath, 'utf8')
    : '';
  const blindedReportHash = blindedReportText ? sha256(blindedReportText) : null;
  const blindInterpretationPath = path.join(root, GENERATED_FILES.aiBlindInterpretation);
  const blindInterpretationText = fs.existsSync(blindInterpretationPath)
    ? fs.readFileSync(blindInterpretationPath, 'utf8')
    : '';
  const blindInterpretationFinalized =
    /^Status:\s*FINALIZED_PRE_UNBLIND\s*$/m.test(blindInterpretationText) &&
    !/^Status:\s*DRAFT_NEEDS_FINALIZATION\s*$/m.test(blindInterpretationText) &&
    (blindedReportHash
      ? blindInterpretationText.includes(`Blinded report SHA256: ${blindedReportHash}`)
      : false);
  const reviewerASigned = (() => {
    const reviewer = blindInterpretationText.match(/^Reviewer A:\s*(.*)$/m)?.[1]?.trim() ?? '';
    const signedAt =
      blindInterpretationText.match(/^Reviewer A Signed At:\s*(.*)$/m)?.[1]?.trim() ?? '';
    return (
      reviewer.length > 0 && reviewer !== 'PENDING' && signedAt.length > 0 && signedAt !== 'PENDING'
    );
  })();
  const reviewerBSigned = (() => {
    const reviewer = blindInterpretationText.match(/^Reviewer B:\s*(.*)$/m)?.[1]?.trim() ?? '';
    const signedAt =
      blindInterpretationText.match(/^Reviewer B Signed At:\s*(.*)$/m)?.[1]?.trim() ?? '';
    return (
      reviewer.length > 0 && reviewer !== 'PENDING' && signedAt.length > 0 && signedAt !== 'PENDING'
    );
  })();
  const reviewerAgreement =
    blindInterpretationText.match(/^Reviewer Agreement:\s*(.*)$/m)?.[1]?.trim() ?? '';
  const adjudicationValid = (() => {
    if (reviewerAgreement === 'AGREE') return true;
    if (reviewerAgreement !== 'DISAGREE') return false;
    const tieBreakReviewer =
      blindInterpretationText.match(/^Tie-break Reviewer:\s*(.*)$/m)?.[1]?.trim() ?? '';
    const tieBreakDecision =
      blindInterpretationText.match(/^Tie-break Decision:\s*(.*)$/m)?.[1]?.trim() ?? '';
    const tieBreakSignedAt =
      blindInterpretationText.match(/^Tie-break Signed At:\s*(.*)$/m)?.[1]?.trim() ?? '';
    return (
      tieBreakReviewer.length > 0 &&
      tieBreakReviewer !== 'PENDING' &&
      tieBreakReviewer !== 'NOT_REQUIRED' &&
      tieBreakDecision.length > 0 &&
      tieBreakDecision !== 'PENDING' &&
      tieBreakDecision !== 'NOT_REQUIRED' &&
      tieBreakSignedAt.length > 0 &&
      tieBreakSignedAt !== 'PENDING' &&
      tieBreakSignedAt !== 'NOT_REQUIRED'
    );
  })();
  const analysisWindowPath = path.join(root, GENERATED_FILES.analysisWindow);
  const analysisWindow = fs.existsSync(analysisWindowPath)
    ? (JSON.parse(fs.readFileSync(analysisWindowPath, 'utf8')) as AnalysisWindow)
    : null;
  const historySnapshots = loadHistorySnapshots(path.join(root, 'ai-generated', 'arms', 'history'));
  const sortedHistoryGeneratedAt = historySnapshots
    .map((snapshot) => snapshot.generatedAt)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .sort();
  const latestHistoryGeneratedAt =
    sortedHistoryGeneratedAt.length > 0
      ? sortedHistoryGeneratedAt[sortedHistoryGeneratedAt.length - 1]
      : null;
  const analysisWindowFresh =
    !!analysisWindow?.lockedAt &&
    analysisWindow.frozenHistoryMaxGeneratedAt !== undefined &&
    !(
      latestHistoryGeneratedAt &&
      analysisWindow.frozenHistoryMaxGeneratedAt &&
      latestHistoryGeneratedAt > analysisWindow.frozenHistoryMaxGeneratedAt
    );
  const protocolDeviationsPath = path.join(root, GENERATED_FILES.protocolDeviations);
  const protocolDeviationsText = fs.existsSync(protocolDeviationsPath)
    ? fs.readFileSync(protocolDeviationsPath, 'utf8')
    : '';
  const unresolvedCriticalMatch = protocolDeviationsText.match(
    /Unresolved Critical Deviations:\s*(\d+)/
  );
  const unresolvedCriticalDeviations = unresolvedCriticalMatch
    ? Number(unresolvedCriticalMatch[1])
    : Number.NaN;
  const runManifestPath = path.join(root, GENERATED_FILES.runManifest);
  const runManifest = fs.existsSync(runManifestPath)
    ? (JSON.parse(fs.readFileSync(runManifestPath, 'utf8')) as RunManifest)
    : null;
  const governance = runManifest?.methodology?.governance;
  const armCompleteness = runManifest?.methodology?.aiMatrix?.armCompleteness;
  const runNormalization = runManifest?.methodology?.runNormalization;
  const holdoutDefinitionPath = path.join(root, GENERATED_FILES.analysisWindow);
  const holdoutDefinitionText = fs.existsSync(holdoutDefinitionPath)
    ? fs.readFileSync(holdoutDefinitionPath, 'utf8')
    : '';
  const holdoutSealPath = path.join(root, GENERATED_FILES.holdoutSeal);
  const holdoutSeal = fs.existsSync(holdoutSealPath)
    ? (JSON.parse(fs.readFileSync(holdoutSealPath, 'utf8')) as HoldoutSeal)
    : null;
  const holdoutSealed =
    !!holdoutSeal &&
    holdoutSeal.holdoutDefinitionPath === GENERATED_FILES.analysisWindow &&
    !!holdoutSeal.holdoutDefinitionSha256 &&
    holdoutDefinitionText.length > 0 &&
    holdoutSeal.holdoutDefinitionSha256 === sha256(holdoutDefinitionText);
  const sentinelControlsPath = path.join(root, GENERATED_FILES.sentinelControls);
  const sentinelControlsText = fs.existsSync(sentinelControlsPath)
    ? fs.readFileSync(sentinelControlsPath, 'utf8')
    : '';
  const sentinelControlsPass = /^Sentinel Control Status:\s*PASS\s*$/m.test(sentinelControlsText);
  const auditTrailPath = path.join(root, GENERATED_FILES.auditTrail);
  const auditTrail = fs.existsSync(auditTrailPath)
    ? (JSON.parse(fs.readFileSync(auditTrailPath, 'utf8')) as AuditTrail)
    : null;
  const auditTrailPresent =
    !!auditTrail &&
    typeof auditTrail.signatureSha256 === 'string' &&
    auditTrail.signatureSha256.length > 0;

  const minConfirmatoryCohorts = Number(process.env.AI_CONFIRMATORY_MIN_COHORTS ?? '3');
  const completedArmKeys = (runManifest?.methodology?.aiMatrix?.arms ?? [])
    .filter((entry) => entry.status === 'completed')
    .map((entry) => entry.key);
  const allCompletedArmsMeetCohortThreshold =
    completedArmKeys.length > 0 &&
    completedArmKeys.every((armKey) => {
      const cohorts = historySnapshots.filter((snapshot) =>
        (snapshot.providers ?? []).some(
          (provider) => provider.key === armKey && provider.status === 'completed'
        )
      ).length;
      return cohorts >= minConfirmatoryCohorts;
    });

  const hasDecisionRuleInBlindedReport =
    blindedReportText.includes('Decision rule: significance requires Holm-adjusted p <= 0.05') &&
    blindedReportText.includes('practical effect requires |delta| >=');

  lines.push(`Governance mode: ${(governance?.mode ?? 'exploratory').toUpperCase()}`);
  lines.push(`Claim class: ${governance?.claimClass ?? 'exploratory-author-interpreted'}`);
  lines.push(`Blind interpretation status: ${governance?.blindInterpretationStatus ?? 'unknown'}`);
  lines.push('');
  lines.push('| Criterion | Status | Evidence |');
  lines.push('|---|---|---|');
  lines.push(
    `| Protocol source artifact exists | ${fs.existsSync(protocolSourcePath) ? 'PASS' : 'FAIL'} | docs/generated/RUN_MANIFEST.json |`
  );
  lines.push(
    `| Protocol seal matches source artifact | ${protocolSealValid ? 'PASS' : 'FAIL'} | docs/generated/PROTOCOL_SEAL.json |`
  );
  lines.push(
    `| Sensitivity-analysis source is sealed | ${powerAnalysisValid ? 'PASS' : 'FAIL'} | docs/generated/SENSITIVITY_ANALYSIS.md + docs/generated/POWER_ANALYSIS_SEAL.json |`
  );
  lines.push(
    `| Full AI matrix coverage for confirmatory claims | ${fullCoverage ? 'PASS' : 'FAIL'} | ai-generated/arms/run-summary.json (${completedArms}/${requiredArms}) |`
  );
  lines.push(
    `| Objectivity report explicitly states complete coverage | ${hasCoverageCompleteLine ? 'PASS' : 'FAIL'} | docs/generated/OBJECTIVITY_ASSESSMENT.md |`
  );
  lines.push(
    `| Run environment manifest present | ${fs.existsSync(path.join(root, GENERATED_FILES.runManifest)) ? 'PASS' : 'FAIL'} | docs/generated/RUN_MANIFEST.json |`
  );
  lines.push(
    `| Governance mode is recorded in manifest | ${governance?.mode ? 'PASS' : 'FAIL'} | docs/generated/RUN_MANIFEST.json methodology.governance |`
  );
  lines.push(
    `| Claim class is recorded in manifest | ${governance?.claimClass ? 'PASS' : 'FAIL'} | docs/generated/RUN_MANIFEST.json methodology.governance |`
  );
  lines.push(
    `| Dependency lock normalization captured | ${runNormalization?.dependencyLockFilePresent && runNormalization?.dependencyLockSha256 ? 'PASS' : 'FAIL'} | docs/generated/RUN_MANIFEST.json methodology.runNormalization |`
  );
  lines.push(
    `| Blinded provider report present | ${fs.existsSync(path.join(root, GENERATED_FILES.aiProviderPromptComparisonBlinded)) ? 'PASS' : 'FAIL'} | docs/generated/AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md |`
  );
  lines.push(
    `| Blind interpretation finalized pre-unblind | ${blindInterpretationFinalized ? 'PASS' : 'FAIL'} | docs/generated/AI_BLIND_INTERPRETATION.md |`
  );
  lines.push(
    `| Blind interpretation reviewer A sign-off present | ${reviewerASigned ? 'PASS' : 'FAIL'} | docs/generated/AI_BLIND_INTERPRETATION.md |`
  );
  lines.push(
    `| Blind interpretation reviewer B sign-off present | ${reviewerBSigned ? 'PASS' : 'FAIL'} | docs/generated/AI_BLIND_INTERPRETATION.md |`
  );
  lines.push(
    `| Reviewer agreement/adjudication is valid | ${adjudicationValid ? 'PASS' : 'FAIL'} | docs/generated/AI_BLIND_INTERPRETATION.md |`
  );
  lines.push(
    `| Frozen analysis window artifact present and fresh | ${analysisWindowFresh ? 'PASS' : 'FAIL'} | docs/generated/ANALYSIS_WINDOW.json |`
  );
  lines.push(
    `| Holdout source artifact is sealed and hash-locked | ${holdoutSealed ? 'PASS' : 'FAIL'} | docs/generated/ANALYSIS_WINDOW.json + docs/generated/HOLDOUT_SEAL.json |`
  );
  lines.push(
    `| Sentinel controls indicate expected detectability | ${sentinelControlsPass ? 'PASS' : 'FAIL'} | docs/generated/SENTINEL_CONTROLS.md |`
  );
  lines.push(
    `| Signed audit trail is present | ${auditTrailPresent ? 'PASS' : 'FAIL'} | docs/generated/AUDIT_TRAIL.json |`
  );
  lines.push(
    `| Blinded report includes significance + practical thresholds | ${hasDecisionRuleInBlindedReport ? 'PASS' : 'FAIL'} | docs/generated/AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md |`
  );
  lines.push(
    `| AI stability report present | ${fs.existsSync(path.join(root, GENERATED_FILES.aiStabilityReport)) ? 'PASS' : 'FAIL'} | docs/generated/AI_STABILITY_REPORT.md |`
  );
  lines.push(
    `| Repeated-run cohort threshold met for completed arms | ${allCompletedArmsMeetCohortThreshold ? 'PASS' : 'FAIL'} | ai-generated/arms/history/*.json (>= ${minConfirmatoryCohorts} per completed arm) |`
  );
  lines.push(
    `| Completed arms include provider names | ${armCompleteness?.allCompletedArmsHaveProviderName ? 'PASS' : 'FAIL'} | docs/generated/RUN_MANIFEST.json methodology.aiMatrix.armCompleteness |`
  );
  lines.push(
    `| Completed arms include provider model identifiers | ${armCompleteness?.allCompletedArmsHaveProviderModelIdentifier ? 'PASS' : 'FAIL'} | docs/generated/RUN_MANIFEST.json methodology.aiMatrix.armCompleteness |`
  );
  lines.push(
    `| Completed arms include prompt fingerprints | ${armCompleteness?.allCompletedArmsHaveSystemPromptFingerprint ? 'PASS' : 'FAIL'} | docs/generated/RUN_MANIFEST.json methodology.aiMatrix.armCompleteness |`
  );
  lines.push(
    `| Completed arms include generation parameters | ${armCompleteness?.allCompletedArmsHaveGenerationParameters ? 'PASS' : 'FAIL'} | docs/generated/RUN_MANIFEST.json methodology.aiMatrix.armCompleteness |`
  );
  lines.push(
    `| Completed arms include retry policy metadata | ${armCompleteness?.allCompletedArmsHaveRetryPolicy ? 'PASS' : 'FAIL'} | docs/generated/RUN_MANIFEST.json methodology.aiMatrix.armCompleteness |`
  );
  lines.push(
    `| AI failure taxonomy report present (for blinded adjudication/kappa) | ${fs.existsSync(path.join(root, GENERATED_FILES.aiFailureTaxonomy)) ? 'PASS' : 'FAIL'} | docs/generated/AI_FAILURE_TAXONOMY.md |`
  );
  lines.push(
    `| Protocol deviations report present | ${fs.existsSync(protocolDeviationsPath) ? 'PASS' : 'FAIL'} | docs/generated/PROTOCOL_DEVIATIONS.md |`
  );
  lines.push(
    `| Protocol deviations unresolved critical count is zero | ${Number.isFinite(unresolvedCriticalDeviations) && unresolvedCriticalDeviations === 0 ? 'PASS' : 'FAIL'} | docs/generated/PROTOCOL_DEVIATIONS.md |`
  );
  lines.push('');
  lines.push(
    'Interpretation: FAIL on any confirmatory criterion means evidence should be treated as exploratory until rerun conditions are satisfied.'
  );

  fs.writeFileSync(path.join(root, GENERATED_FILES.preregCompliance), `${lines.join('\n')}\n`);
  console.log(`Wrote ${path.join(root, GENERATED_FILES.preregCompliance)}`);
}

main();
