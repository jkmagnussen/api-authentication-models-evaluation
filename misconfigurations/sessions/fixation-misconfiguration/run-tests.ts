process.env.APP_VARIANT = "sessions-fixation-misconfiguration";

import "./app.variant";
import { runAllTests } from "../../../tests/run-all-tests";

runAllTests();
