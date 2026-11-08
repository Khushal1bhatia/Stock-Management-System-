import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DUMMY_HASH, hashPassword, verifyPassword } from "../src/lib/auth/password";

describe("Argon2id password hashing", () => {
  it("produces a version 19 Argon2id hash", async () => {
    const hashed = await hashPassword("correcthorse1");
    assert.match(hashed, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    assert.notEqual(hashed, "correcthorse1");
  });

  it("salts each hash differently", async () => {
    const [first, second] = await Promise.all([
      hashPassword("correcthorse1"),
      hashPassword("correcthorse1")
    ]);
    assert.notEqual(first, second);
  });

  it("verifies the correct password and rejects a wrong one", async () => {
    const hashed = await hashPassword("correcthorse1");
    assert.equal(await verifyPassword(hashed, "correcthorse1"), true);
    assert.equal(await verifyPassword(hashed, "correcthorse2"), false);
  });

  it("returns false for malformed hashes instead of throwing", async () => {
    assert.equal(await verifyPassword("not-a-hash", "correcthorse1"), false);
    assert.equal(await verifyPassword("", "correcthorse1"), false);
  });

  it("ships a usable dummy hash for timing-safe failed logins", async () => {
    assert.match(DUMMY_HASH, /^\$argon2id\$/);
    assert.equal(await verifyPassword(DUMMY_HASH, "definitely-not-the-password"), false);
  });
});
