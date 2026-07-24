process.env.APP_VARIANT = 'oauth-scope-misconfiguration';

import './app.variant';
import { runAllTests } from '../../../tests/run-all-tests';

runAllTests();
