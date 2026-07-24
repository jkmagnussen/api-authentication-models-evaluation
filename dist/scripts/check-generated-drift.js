"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const report_paths_1 = require("./report-paths");
function main() {
    const strictUntracked = process.argv.includes('--strict-untracked');
    const trackedArgs = ['diff', '--name-only', '--', ...report_paths_1.DRIFT_CHECK_PATHS];
    const trackedResult = (0, child_process_1.spawnSync)('git', trackedArgs, { encoding: 'utf8' });
    if (trackedResult.status !== 0) {
        console.error('Failed to run git drift check.');
        if (trackedResult.error) {
            console.error(trackedResult.error.message);
        }
        if (trackedResult.stderr?.trim()) {
            console.error(trackedResult.stderr.trim());
        }
        process.exit(trackedResult.status ?? 2);
    }
    const trackedOutput = trackedResult.stdout?.trim() ?? '';
    const untrackedArgs = ['ls-files', '--others', '--exclude-standard', '--', ...report_paths_1.DRIFT_CHECK_PATHS];
    const untrackedResult = (0, child_process_1.spawnSync)('git', untrackedArgs, { encoding: 'utf8' });
    if (untrackedResult.status !== 0) {
        console.error('Failed to check untracked generated artifacts.');
        if (untrackedResult.error) {
            console.error(untrackedResult.error.message);
        }
        if (untrackedResult.stderr?.trim()) {
            console.error(untrackedResult.stderr.trim());
        }
        process.exit(untrackedResult.status ?? 2);
    }
    const untrackedOutput = untrackedResult.stdout?.trim() ?? '';
    if (!trackedOutput && (!strictUntracked || !untrackedOutput)) {
        if (untrackedOutput && !strictUntracked) {
            console.warn('Untracked generated artifacts detected (non-blocking in default mode):');
            console.warn(untrackedOutput);
            console.warn('Use: npm run docs:drift:strict to fail on untracked artifacts.');
        }
        console.log('No generated artifact drift detected.');
        return;
    }
    console.error('Generated artifact drift detected.');
    console.error('Run: npm run docs:generate');
    console.error('Then review and commit intended generated artifact updates.');
    if (trackedOutput) {
        console.error('Tracked changes:');
        console.error(trackedOutput);
    }
    if (strictUntracked && untrackedOutput) {
        console.error('Untracked changes:');
        console.error(untrackedOutput);
    }
    process.exit(1);
}
main();
