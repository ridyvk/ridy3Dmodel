export const INITIAL_BLINK_DELAY_SECONDS = 8.5;

// Six blinks take exactly two minutes after the initial cue: three per minute
// on average, with restrained variation that never feels metronomic or erratic.
export const BLINK_INTERVALS_SECONDS = [18.4, 21.2, 20.4, 19.1, 21.6, 19.3] as const;

export type EarActionKind = "left" | "right" | "both";

export const EAR_ACTION_SEQUENCE = [
  { delaySeconds: 4.8, kind: "left" },
  { delaySeconds: 8.6, kind: "right" },
  { delaySeconds: 10.2, kind: "both" },
  { delaySeconds: 7.4, kind: "left" },
  { delaySeconds: 9.7, kind: "right" },
  { delaySeconds: 11.1, kind: "both" },
] as const satisfies ReadonlyArray<{ delaySeconds: number; kind: EarActionKind }>;

export type ForepawActionKind = "left" | "right";

export const FOREPAW_ACTION_SEQUENCE = [
  { delaySeconds: 6.4, kind: "left" },
  { delaySeconds: 19.6, kind: "right" },
  { delaySeconds: 23.1, kind: "left" },
  { delaySeconds: 17.8, kind: "right" },
  { delaySeconds: 21.7, kind: "left" },
  { delaySeconds: 24.4, kind: "right" },
] as const satisfies ReadonlyArray<{
  delaySeconds: number;
  kind: ForepawActionKind;
}>;

export type HindpawActionKind = "left" | "right";

export const HINDPAW_ACTION_SEQUENCE = [
  { delaySeconds: 11.4, kind: "right" },
  { delaySeconds: 33.8, kind: "left" },
  { delaySeconds: 37.6, kind: "right" },
  { delaySeconds: 35.1, kind: "left" },
  { delaySeconds: 40.2, kind: "right" },
  { delaySeconds: 34.3, kind: "left" },
] as const satisfies ReadonlyArray<{
  delaySeconds: number;
  kind: HindpawActionKind;
}>;

export type AttentionActionKind = "left" | "right";

export const ATTENTION_ACTION_SEQUENCE = [
  { delaySeconds: 7.6, kind: "left" },
  { delaySeconds: 29.4, kind: "right" },
  { delaySeconds: 33.8, kind: "left" },
  { delaySeconds: 26.7, kind: "right" },
  { delaySeconds: 35.1, kind: "left" },
  { delaySeconds: 30.6, kind: "right" },
] as const satisfies ReadonlyArray<{
  delaySeconds: number;
  kind: AttentionActionKind;
}>;
