process.env.APP_VARIANT = 'jwt-audience-misconfiguration';

import './app.variant';
import { runAllTests } from '../../../tests/run-all-tests';

runAllTests();
