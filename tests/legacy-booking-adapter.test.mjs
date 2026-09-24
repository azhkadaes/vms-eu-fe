import test from "node:test";
import assert from "node:assert/strict";
import { parseLegacyBookingCreated } from "../src/services/legacyBookingAdapter.ts";
import { witaDate } from "../src/services/wita.ts";

test("legacy booking adapter preserves leading zeros", () => {
  assert.deepEqual(parseLegacyBookingCreated({ pin: "000042" }), { pin: "000042" });
});

test("legacy booking adapter rejects missing or non-string codes", () => {
  assert.throws(() => parseLegacyBookingCreated({}), /tidak diterima/);
  assert.throws(() => parseLegacyBookingCreated({ pin: 42 }), /tidak valid/);
  assert.throws(() => parseLegacyBookingCreated({ pin: "BK100000" }), /tidak valid/);
});

test("visitor date minimum follows WITA across UTC midnight", () => {
  assert.equal(witaDate(new Date("2026-09-23T15:59:00Z")), "2026-09-23");
  assert.equal(witaDate(new Date("2026-09-23T16:00:00Z")), "2026-09-24");
});
