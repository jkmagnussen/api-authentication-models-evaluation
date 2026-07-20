import { applyOverride } from "../../apply-override";
import { jwtAlgorithmMisconfiguration } from "./algorithm.config";

applyOverride({ jwt: jwtAlgorithmMisconfiguration });

import app from "../../../src/app";

export default app;
