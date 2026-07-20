process.env.APP_VARIANT = "sessions-cookie-flag-misconfiguration";

import "./app.variant";
import { runAllTests } from "../../../tests/run-all-tests";

runAllTests();
