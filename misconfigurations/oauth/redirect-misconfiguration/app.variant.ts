import { applyOverride } from "../../apply-override";
import { oauthRedirectMisconfiguration } from "./redirect.config";

applyOverride({ oauth: oauthRedirectMisconfiguration });

import app from "../../../src/app";

export default app;
