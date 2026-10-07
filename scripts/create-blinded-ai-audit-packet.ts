import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const STUDY_ID = 'ai-clean-2026-10-05';
const ARMS = [
  'openai-neutral',
  'openai-security-guided',
  'claude-neutral',
  'claude-security-guided',
] as const;
const MECHANISMS = ['oauth', 'jwt', 'sessions'] as const;
const SAMPLES_PER_STRATUM = 3;
const SELECTION_SEED = 'independent-review-protocol-20261006-v1';

type Arm = typeof ARMS[number];
type Mechanism = typeof MECHANISMS[number];

type AutomatedCheck = {
  name: string;
  passed: boolean;
  details: string;
};

type Candidate = {
  arm: Arm;
  mechanism: Mechanism;
  cohort: number;
  sourcePath: string;
  sourceHash: string;
  code: string;
  automatedChecks: AutomatedCheck[];
  selectionHash: string;
  orderHash: string;
};

type ReviewItem = Candidate & { reviewId: string };

function sha256(value: string | Buffer) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function displayMechanism(mechanism: Mechanism) {
  if (mechanism === 'oauth') return 'OAuth 2.0 with PKCE';
  if (mechanism === 'jwt') return 'JWT';
  return 'Sessions';
}

function loadCandidates(studyRoot: string): Candidate[] {
  const candidates: Candidate[] = [];

  for (const arm of ARMS) {
    for (const mechanism of MECHANISMS) {
      for (let cohort = 1; cohort <= 30; cohort += 1) {
        const cohortLabel = String(cohort).padStart(2, '0');
        const sourceSampleName = 'sample1.ts';
        const aggregateSampleName = `sample${cohort}`;
        const samplePath = path.join(studyRoot, `cohort-${cohortLabel}`, 'arms', arm, mechanism, sourceSampleName);
        const resultPath = path.join(studyRoot, 'aggregate', 'arms', arm, 'results', `${mechanism}-${aggregateSampleName}-tests.json`);
        if (!fs.existsSync(samplePath) || !fs.existsSync(resultPath)) {
          throw new Error(`Missing sample or heuristic result for ${arm}/${mechanism}/cohort-${cohortLabel}.`);
        }

        const codeBuffer = fs.readFileSync(samplePath);
        const automated = JSON.parse(fs.readFileSync(resultPath, 'utf8')) as { checks?: AutomatedCheck[] };
        if (!Array.isArray(automated.checks) || automated.checks.length === 0) {
          throw new Error(`No named heuristic checks found in ${path.relative(process.cwd(), resultPath)}.`);
        }

        candidates.push({
          arm,
          mechanism,
          cohort,
          sourcePath: path.relative(process.cwd(), samplePath).split(path.sep).join('/'),
          sourceHash: sha256(codeBuffer),
          code: codeBuffer.toString('utf8'),
          automatedChecks: automated.checks,
          selectionHash: sha256(`${SELECTION_SEED}|select|${arm}|${mechanism}|${cohort}`),
          orderHash: sha256(`${SELECTION_SEED}|order|${arm}|${mechanism}|${cohort}`),
        });
      }
    }
  }

  return candidates;
}

function buildReviewItems(candidates: Candidate[]): ReviewItem[] {
  // Hash-ranked selection is deterministic and balanced within each hidden arm-by-mechanism stratum.
  const selected = ARMS.flatMap((arm) => MECHANISMS.flatMap((mechanism) => candidates
    .filter((candidate) => candidate.arm === arm && candidate.mechanism === mechanism)
    .sort((left, right) => left.selectionHash.localeCompare(right.selectionHash))
    .slice(0, SAMPLES_PER_STRATUM)))
    .sort((left, right) => left.orderHash.localeCompare(right.orderHash));

  return selected.map((candidate, index) => ({
    ...candidate,
    reviewId: `RVW-${String(index + 1).padStart(3, '0')}`,
  }));
}

function renderPacket(items: ReviewItem[]) {
  const lines = [
    '# Blinded AI Authentication Heuristic Review',
    '',
    `Protocol: ${STUDY_ID} / independent-review-v1`,
    `Sample count: ${items.length} (stratified by authentication mechanism; 3 samples per hidden provider-prompt arm × mechanism stratum)`,
    '',
    '## Reviewer Instructions',
    '',
    'Have two reviewers rate the packet independently before discussion. Provider and prompt-condition labels are intentionally withheld. Do not infer labels from writing style. Assess code semantics and likely behavior; do not assume a static pattern is sufficient proof. For each criterion, choose PASS, FAIL, UNCLEAR, or NOT-APPLICABLE and provide a short rationale. Record syntax or execution limitations separately from security judgments. Keep both initial rating files so inter-rater agreement can be calculated before adjudication.',
    '',
    'Use the companion response template. Do not request or inspect the restricted key until all independent ratings are submitted and fixed.',
    '',
    '## Review Items',
    '',
  ];

  for (const item of items) {
    lines.push(`### ${item.reviewId}`);
    lines.push('');
    lines.push(`Mechanism: ${displayMechanism(item.mechanism)}`);
    lines.push('');
    lines.push('Control criteria:');
    for (const check of item.automatedChecks) {
      lines.push(`- ${check.name}: ${check.details}`);
    }
    lines.push('');
    lines.push('Code under review:');
    lines.push('');
    lines.push('````typescript');
    lines.push(item.code.trimEnd());
    lines.push('````');
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function renderResponseTemplate(items: ReviewItem[]) {
  const rows = ['reviewer_id,review_id,mechanism,control,reviewer_outcome,rationale,syntax_or_execution_note'];
  for (const item of items) {
    for (const check of item.automatedChecks) {
      const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
      rows.push([
        '',
        item.reviewId,
        escapeCsv(displayMechanism(item.mechanism)),
        escapeCsv(check.name),
        '',
        '',
        '',
      ].join(','));
    }
  }
  return `${rows.join('\n')}\n`;
}

function main() {
  const studyRoot = path.join(process.cwd(), 'ai-generated', 'cohorts', STUDY_ID);
  const outputRoot = path.join(process.cwd(), 'docs', 'generated');
  const items = buildReviewItems(loadCandidates(studyRoot));
  const packetPath = path.join(outputRoot, 'AI_HEURISTIC_AUDIT_PACKET.md');
  const keyPath = path.join(outputRoot, 'AI_HEURISTIC_AUDIT_KEY_RESTRICTED.json');
  const responsePath = path.join(outputRoot, 'AI_HEURISTIC_AUDIT_RESPONSE_TEMPLATE.csv');

  fs.writeFileSync(packetPath, renderPacket(items), 'utf8');
  fs.writeFileSync(responsePath, renderResponseTemplate(items), 'utf8');
  // Keep the unblinding map separate so reviewers cannot see arm labels before ratings are locked.
  fs.writeFileSync(keyPath, `${JSON.stringify({
    studyId: STUDY_ID,
    protocol: 'independent-review-v1',
    selectionSeed: SELECTION_SEED,
    sampleCount: items.length,
    distribution: '3 per provider-prompt arm × mechanism stratum',
    doNotShareWithReviewersBeforeRatingsAreLocked: true,
    items: items.map((item) => ({
      reviewId: item.reviewId,
      providerPromptArm: item.arm,
      mechanism: item.mechanism,
      cohort: item.cohort,
      sourcePath: item.sourcePath,
      sourceSha256: item.sourceHash,
      automatedChecks: item.automatedChecks,
    })),
  }, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${items.length} blinded review items to ${path.relative(process.cwd(), packetPath)}`);
  console.log(`Wrote restricted mapping key to ${path.relative(process.cwd(), keyPath)}`);
  console.log(`Wrote reviewer response template to ${path.relative(process.cwd(), responsePath)}`);
}

main();