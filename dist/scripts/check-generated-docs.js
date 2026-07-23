"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const report_paths_1 = require("./report-paths");
function main() {
    const missing = report_paths_1.EXPECTED_GENERATED_DOC_FILES.filter((file) => !fs_1.default.existsSync(file));
    if (missing.length > 0) {
        console.error("Missing generated artifacts:");
        for (const file of missing) {
            console.error(`- ${file}`);
        }
        console.error("Run: npm run docs:generate");
        process.exit(1);
    }
    console.log("All expected generated artifacts are present.");
}
main();
