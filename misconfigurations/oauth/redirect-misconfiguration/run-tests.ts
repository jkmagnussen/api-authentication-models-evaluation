process.env.APP_VARIANT = 'oauth-redirect-misconfiguration';

import './app.variant';
import { runAllTests } from '../../../tests/run-all-tests';

runAllTests();
