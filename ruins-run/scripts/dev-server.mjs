#!/usr/bin/env node
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function option(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const host = option("host", "127.0.0.1");
const port = Number(option("port", "5173"));
const root = path.resolve(projectRoot, option("root", "."));

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".ico", "image/x-icon"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".mp3", "audio/mpeg"],
  [".wav", "audio/wav"],
]);

function resolveRequest(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://local").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const candidate = path.resolve(root, relative);
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) return null;
  return candidate;
}

const server = createServer((request, response) => {
  let file = resolveRequest(request.url || "/");
  if (!file) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  if (!existsSync(file) || !statSync(file).isFile()) {
    const fallback = path.join(root, "index.html");
    if (path.extname(file) || !existsSync(fallback)) {
      response.writeHead(404).end("Not found");
      return;
    }
    file = fallback;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes.get(path.extname(file).toLowerCase()) || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  createReadStream(file).pipe(response);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
    process.exitCode = 1;
    return;
  }
  throw error;
});

server.listen(port, host, () => {
  const displayHost = host === "0.0.0.0" ? "localhost" : host;
  console.log(`Ruins Run Portal: http://${displayHost}:${port}/`);
});
