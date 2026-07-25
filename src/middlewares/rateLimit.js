const requestBuckets = new Map();

export const createRateLimit = ({
  windowMs = 15 * 60 * 1000,
  max = 10,
  keyPrefix = "default",
} = {}) => {
  return (req, res, next) => {
    const key = `${keyPrefix}:${req.ip || req.connection?.remoteAddress || "unknown"}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    const bucket = requestBuckets.get(key) || [];
    const active = bucket.filter((timestamp) => timestamp > windowStart);

    if (active.length >= max) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    }

    active.push(now);
    requestBuckets.set(key, active);
    next();
  };
};
