import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many auth attempts from this IP, please try again later.",
  },
});

export default authLimiter;
export { authLimiter };