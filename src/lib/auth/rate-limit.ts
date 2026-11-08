type Bucket = { count: number; resetAt: number };

/**
 * Small in-process fixed-window limiter for single-instance deployments.
 * Replace with a shared store (Redis/Upstash) when running multiple instances.
 */
const buckets = new Map<string, Bucket>();

function sweep(now: number) {
  if (buckets.size < 5_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  const bucket = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : existing;

  bucket.count += 1;
  buckets.set(key, bucket);

  const allowed = bucket.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterMs: allowed ? 0 : Math.max(0, bucket.resetAt - now)
  };
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}
