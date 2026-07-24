import { applyOverride } from '../../apply-override';
import { sessionFixationMisconfiguration } from './fixation.config';

applyOverride({ sessions: sessionFixationMisconfiguration });

import app from '../../../src/app';

export default app;
