import rateLimit from 'express-rate-limit';
import { APP_CONFIG } from '../config';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: APP_CONFIG.security.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    error: 'Too many auth attempts from this IP, please try again later.',
  },
});

export default authLimiter;
export { authLimiter };
