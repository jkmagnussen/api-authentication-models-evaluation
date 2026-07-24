"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const variant_test_map_1 = require("../misconfigurations/variant-test-map");
function main() {
    const variantName = process.argv[2];
    if (!variantName || !(variantName in variant_test_map_1.variantTestMap)) {
        console.error('Usage: ts-node scripts/run-variant-focused-tests.ts <variant-name>');
        process.exit(1);
    }
    const focusedTest = variant_test_map_1.variantTestMap[variantName].focusedTest;
    const result = (0, child_process_1.spawnSync)('npx', ['jest', '--runInBand', focusedTest], {
        stdio: 'inherit',
        shell: true,
        env: {
            ...process.env,
            APP_VARIANT: variantName,
        },
    });
    process.exit(result.status ?? 1);
}
main();
