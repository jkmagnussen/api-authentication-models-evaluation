import { applyOverride } from '../../apply-override';
import { logoutMisconfiguration } from './logout.config';

applyOverride({ sessions: logoutMisconfiguration });

import app from '../../../src/app';

export default app;
