"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllTests = runAllTests;
const child_process_1 = require("child_process");
function runAllTests() {
    const result = (0, child_process_1.spawnSync)('npx', ['jest', '--runInBand'], {
        stdio: 'inherit',
        shell: true,
        env: process.env,
    });
    process.exit(result.status ?? 1);
}
