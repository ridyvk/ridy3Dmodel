import assert from "node:assert/strict";
import test from "node:test";
import {
  nostrilOpenFromRise,
  nostrilSurfaceWeightFromOpen,
  nostrilTissueStrengthFromOpen,
} from "../src/noseMotion.ts";

test("nose stays photographed and closed at rest", () => {
  assert.equal(nostrilOpenFromRise(0), 0);
  assert.equal(nostrilSurfaceWeightFromOpen(0), 0);
  assert.equal(nostrilTissueStrengthFromOpen(0), 0);
});

test("nose reveals only a restrained fold at the sniff peak", () => {
  const open = nostrilOpenFromRise(0.00265);
  assert.ok(open > 0.95 && open <= 1);
  assert.ok(nostrilSurfaceWeightFromOpen(open) <= 0.18);
  assert.ok(nostrilTissueStrengthFromOpen(open) > 0.9);
});
