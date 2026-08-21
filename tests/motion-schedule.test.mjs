import assert from "node:assert/strict";
import test from "node:test";
import {
  ATTENTION_ACTION_SEQUENCE,
  BLINK_INTERVALS_SECONDS,
  EAR_ACTION_SEQUENCE,
  FOREPAW_ACTION_SEQUENCE,
  HINDPAW_ACTION_SEQUENCE,
} from "../src/motionSchedule.ts";

test("blink rhythm averages three natural blinks per minute", () => {
  const total = BLINK_INTERVALS_SECONDS.reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(total - 120) < 1e-9);
  assert.ok(BLINK_INTERVALS_SECONDS.every((value) => value >= 18 && value <= 22));
  assert.ok(new Set(BLINK_INTERVALS_SECONDS).size > 3);
});

test("every skeletal one-shot sequence remains calm and varied", () => {
  for (const sequence of [
    EAR_ACTION_SEQUENCE,
    FOREPAW_ACTION_SEQUENCE,
    HINDPAW_ACTION_SEQUENCE,
    ATTENTION_ACTION_SEQUENCE,
  ]) {
    assert.ok(sequence.length >= 6);
    assert.ok(sequence.every((cue) => cue.delaySeconds > 4));
    assert.ok(new Set(sequence.map((cue) => cue.delaySeconds)).size >= 5);
  }
});
