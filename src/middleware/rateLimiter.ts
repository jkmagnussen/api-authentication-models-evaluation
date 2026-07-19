import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.AUTH_RATE_LIMIT_MAX ?? (process.env.NODE_ENV === "test" ? 5 : 200)),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    error: "Too many auth attempts from this IP, please try again later.",
  },
});

export default authLimiter;
export { authLimiter };