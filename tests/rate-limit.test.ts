import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clearRateLimit, rateLimit } from "../src/lib/auth/rate-limit";

let sequence = 0;
function uniqueKey() {
  sequence += 1;
  return `test-${process.pid}-${Date.now()}-${sequence}`;
}

describe("rate limiting", () => {
  it("allows requests up to the limit and reports the remainder", () => {
    const key = uniqueKey();
    assert.deepEqual(rateLimit(key, 3, 60_000), { allowed: true, remaining: 2, retryAfterMs: 0 });
    assert.deepEqual(rateLimit(key, 3, 60_000), { allowed: true, remaining: 1, retryAfterMs: 0 });
    assert.deepEqual(rateLimit(key, 3, 60_000), { allowed: true, remaining: 0, retryAfterMs: 0 });
  });

  it("blocks requests past the limit with a retry window", () => {
    const key = uniqueKey();
    rateLimit(key, 1, 60_000);
    const blocked = rateLimit(key, 1, 60_000);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.retryAfterMs > 0);
    assert.ok(blocked.retryAfterMs <= 60_000);
  });

  it("tracks keys independently", () => {
    const first = uniqueKey();
    const second = uniqueKey();
    rateLimit(first, 1, 60_000);
    assert.equal(rateLimit(first, 1, 60_000).allowed, false);
    assert.equal(rateLimit(second, 1, 60_000).allowed, true);
  });

  it("clears a bucket on demand", () => {
    const key = uniqueKey();
    rateLimit(key, 1, 60_000);
    clearRateLimit(key);
    assert.equal(rateLimit(key, 1, 60_000).allowed, true);
  });

  it("resets after the window elapses", async () => {
    const key = uniqueKey();
    rateLimit(key, 1, 40);
    assert.equal(rateLimit(key, 1, 40).allowed, false);
    await new Promise((resolve) => setTimeout(resolve, 70));
    assert.equal(rateLimit(key, 1, 40).allowed, true);
  });
});
