"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const report_paths_1 = require("./report-paths");
function sha256(text) {
    return (0, crypto_1.createHash)("sha256").update(text).digest("hex");
}
function main() {
    const root = process.cwd();
    const blindedReportPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.aiProviderPromptComparisonBlinded);
    const outputPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.aiBlindInterpretation);
    if (!fs_1.default.existsSync(blindedReportPath)) {
        throw new Error(`Missing blinded report: ${report_paths_1.GENERATED_FILES.aiProviderPromptComparisonBlinded}. Run npm run objective:blind:report first.`);
    }
    const blindedText = fs_1.default.readFileSync(blindedReportPath, "utf8");
    const blindedHash = sha256(blindedText);
    if (fs_1.default.existsSync(outputPath)) {
        const existing = fs_1.default.readFileSync(outputPath, "utf8");
        const finalized = existing.includes("Status: FINALIZED_PRE_UNBLIND");
        const hasCurrentHash = existing.includes(`Blinded report SHA256: ${blindedHash}`);
        if (finalized && hasCurrentHash) {
            console.log(`Preserved finalized blind interpretation: ${outputPath}`);
            return;
        }
    }
    const lines = [];
    lines.push("# AI Blind Interpretation");
    lines.push("");
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push("Regenerate: npm run objective:blind:interpretation");
    lines.push("");
    lines.push("Status: DRAFT_NEEDS_FINALIZATION");
    lines.push(`Blinded report SHA256: ${blindedHash}`);
    lines.push("");
    lines.push("## Pre-Unblind Interpretation");
    lines.push("");
    lines.push("1. Primary contrast identified (Arm X vs Arm Y):");
    lines.push("- Replace with blinded arm labels and rationale.");
    lines.push("");
    lines.push("2. Decision-rule statement:");
    lines.push("- State whether blinded contrasts meet both Holm-adjusted significance and practical effect thresholds.");
    lines.push("");
    lines.push("3. Caveats before unblinding:");
    lines.push("- Record uncertainty and any reasons to keep conclusions exploratory.");
    lines.push("");
    lines.push("## Reviewer Sign-off");
    lines.push("");
    lines.push("Reviewer A: PENDING");
    lines.push("Reviewer A Signed At: PENDING");
    lines.push("Reviewer A Independence: PENDING");
    lines.push("Reviewer A COI Disclosure: PENDING");
    lines.push("Reviewer B: PENDING");
    lines.push("Reviewer B Signed At: PENDING");
    lines.push("Reviewer B Independence: PENDING");
    lines.push("Reviewer B COI Disclosure: PENDING");
    lines.push("Reviewer Selection Policy: Reviewer A and Reviewer B must be distinct, independent reviewers.");
    lines.push("");
    lines.push("## Adjudication");
    lines.push("");
    lines.push("Reviewer Agreement: PENDING");
    lines.push("Tie-break Reviewer: PENDING");
    lines.push("Tie-break Decision: PENDING");
    lines.push("Tie-break Signed At: PENDING");
    lines.push("");
    lines.push("## Finalization");
    lines.push("");
    lines.push("- Replace `Status: DRAFT_NEEDS_FINALIZATION` with `Status: FINALIZED_PRE_UNBLIND` after interpretation is complete and before consulting unblinded labels.");
    lines.push("- Keep the blinded report SHA256 unchanged; if it changes, re-interpret and re-finalize.");
    fs_1.default.writeFileSync(outputPath, `${lines.join("\n")}\n`);
    console.log(`Wrote ${outputPath}`);
}
main();
