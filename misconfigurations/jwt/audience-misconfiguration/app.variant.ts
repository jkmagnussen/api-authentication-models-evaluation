import { applyOverride } from '../../apply-override';
import { jwtAudienceMisconfiguration } from './audience.config';

applyOverride({ jwt: jwtAudienceMisconfiguration });

import app from '../../../src/app';

export default app;
