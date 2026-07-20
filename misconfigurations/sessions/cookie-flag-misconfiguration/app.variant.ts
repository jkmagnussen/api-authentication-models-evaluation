import { applyOverride } from "../../apply-override";
import { cookieFlagMisconfiguration } from "./cookie-flag.config";

applyOverride({ sessions: cookieFlagMisconfiguration });

import app from "../../../src/app";

export default app;
