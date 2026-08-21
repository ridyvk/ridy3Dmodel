import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const MODEL_PATH = new URL("../public/models/ridy-rabbit-v1.glb", import.meta.url);
const bytes = await readFile(MODEL_PATH);

assert.equal(bytes.toString("ascii", 0, 4), "glTF", "model must be a GLB file");
assert.equal(bytes.readUInt32LE(4), 2, "model must use GLB version 2");
assert.ok(bytes.length > 5_000_000, "full photographed rabbit model is unexpectedly small");

const jsonLength = bytes.readUInt32LE(12);
assert.equal(bytes.readUInt32LE(16), 0x4e4f534a, "first GLB chunk must be JSON");
const document = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8").trim());

const expectedClips = [
  "Rabbit_Idle_Alive_v22",
  "Rabbit_Blink_Natural_v22",
  "Rabbit_Ear_L_v22",
  "Rabbit_Ear_R_v22",
  "Rabbit_Nose_Twitch_v22",
  "Rabbit_Forepaw_Adjust_L_v22",
  "Rabbit_Forepaw_Adjust_R_v22",
  "Rabbit_Hindpaw_Settle_L_v22",
  "Rabbit_Hindpaw_Settle_R_v22",
  "Rabbit_Attention_L_v22",
  "Rabbit_Attention_R_v22",
];

const clipNames = new Set(document.animations?.map((clip) => clip.name));
for (const clipName of expectedClips) {
  assert.ok(clipNames.has(clipName), `missing animation clip: ${clipName}`);
}

assert.equal(document.skins?.length, 1, "rabbit must have one continuous skin");
assert.equal(document.skins[0].joints.length, 35, "rabbit must keep its 35-bone rig");
assert.deepEqual(
  document.meshes?.[0]?.extras?.targetNames,
  ["Blink_L", "Blink_R", "Nostril_Open"],
  "blink and nostril morph targets changed",
);

const positionVertexCount = document.meshes
  .flatMap((mesh) => mesh.primitives)
  .reduce((sum, primitive) => sum + document.accessors[primitive.attributes.POSITION].count, 0);
assert.ok(positionVertexCount >= 175_000, "high-detail rabbit mesh is missing");

console.log(
  `model ok: ${positionVertexCount.toLocaleString()} vertices, ${document.skins[0].joints.length} bones, ${expectedClips.length} clips`,
);
