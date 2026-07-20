import { applyOverride } from "../../apply-override";
import { oauthScopeMisconfiguration } from "./scope.config";

applyOverride({ oauth: oauthScopeMisconfiguration });

import app from "../../../src/app";

export default app;
