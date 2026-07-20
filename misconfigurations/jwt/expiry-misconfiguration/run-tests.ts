process.env.APP_VARIANT = "jwt-expiry-misconfiguration";

import "./app.variant";
import { runAllTests } from "../../../tests/run-all-tests";

runAllTests();
