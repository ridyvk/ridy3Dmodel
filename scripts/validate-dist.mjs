import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const root = new URL("../dist/", import.meta.url);
const requiredFiles = [
  "index.html",
  "manifest.webmanifest",
  "sw.js",
  "models/ridy-rabbit-v1.glb",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
];

for (const path of requiredFiles) {
  const file = new URL(path, root);
  assert.ok((await stat(file)).size > 0, `missing production file: ${path}`);
}

const html = await readFile(new URL("index.html", root), "utf8");
assert.match(html, /<title>ridy<\/title>/);
assert.match(html, /\/ridy3Dmodel\/manifest\.webmanifest/);
assert.match(html, /\/ridy3Dmodel\/assets\/index-/);

const manifest = JSON.parse(await readFile(new URL("manifest.webmanifest", root), "utf8"));
assert.equal(manifest.name, "ridy");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "./");
assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));

console.log("production bundle ok: app shell, model, service worker, and install icons present");
