#!/usr/bin/env node
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = path.join(root, "dist/client");

await rm(client, { recursive: true, force: true });
await mkdir(client, { recursive: true });

await Promise.all([
  cp(path.join(root, "index.html"), path.join(client, "index.html")),
  cp(path.join(root, "src"), path.join(client, "src"), { recursive: true }),
  cp(path.join(root, "assets"), path.join(client, "assets"), { recursive: true }),
]);

console.log("Built static client: dist/client");
