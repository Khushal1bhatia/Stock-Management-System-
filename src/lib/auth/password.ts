import { hash, verify, type Options } from "@node-rs/argon2";

// Algorithm.Argon2id === 2. The package exposes it as an ambient const enum,
// which cannot be read as a value when isolatedModules is enabled.
const ARGON_OPTIONS: Options = {
  algorithm: 2,
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1
};

/** A real Argon2id hash used to keep failed-user lookups timing-safe. */
export const DUMMY_HASH = "$argon2id$v=19$m=19456,t=2,p=1$+STdVCuzvuBm7lw9QfjltA$ivFRDvEIcOi+89WptBLMvIDOIGpoPM3cS1IX1jtO2Us";

export async function hashPassword(password: string) {
  return hash(password, ARGON_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password, ARGON_OPTIONS);
  } catch {
    return false;
  }
}
