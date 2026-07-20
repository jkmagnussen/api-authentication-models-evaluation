process.env.APP_VARIANT = "oauth-state-misconfiguration";

import "./app.variant";
import { runAllTests } from "../../../tests/run-all-tests";

runAllTests();
