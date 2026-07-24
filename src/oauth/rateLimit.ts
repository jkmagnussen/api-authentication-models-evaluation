import rateLimit from 'express-rate-limit';

export const oauthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'rate_limited',
    error_description: 'Too many OAuth requests, slow down.',
  },
});
