// Entrypoint wrapper for container and Cloud Run execution
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cjsBundle = path.join(__dirname, "dist", "server.cjs");

if (fs.existsSync(cjsBundle)) {
  await import("./dist/server.cjs");
} else {
  await import("./server.ts");
}
