process.env.APP_VARIANT = 'jwt-algorithm-misconfiguration';

import './app.variant';
import { runAllTests } from '../../../tests/run-all-tests';

runAllTests();
