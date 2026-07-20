import { applyOverride } from "../../apply-override";
import { jwtExpiryMisconfiguration } from "./expiry.config";

applyOverride({ jwt: jwtExpiryMisconfiguration });

import app from "../../../src/app";

export default app;
