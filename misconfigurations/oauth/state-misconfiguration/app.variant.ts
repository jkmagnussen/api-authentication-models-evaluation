import { applyOverride } from "../../apply-override";
import { oauthStateMisconfiguration } from "./state.config";

applyOverride({ oauth: oauthStateMisconfiguration });

import app from "../../../src/app";

export default app;
