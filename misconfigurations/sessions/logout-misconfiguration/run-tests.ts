process.env.APP_VARIANT = "sessions-logout-misconfiguration";

import "./app.variant";
import { runAllTests } from "../../../tests/run-all-tests";

runAllTests();
