"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env.APP_VARIANT = 'sessions-cookie-flag-misconfiguration';
require("./app.variant");
const run_all_tests_1 = require("../../../tests/run-all-tests");
(0, run_all_tests_1.runAllTests)();
