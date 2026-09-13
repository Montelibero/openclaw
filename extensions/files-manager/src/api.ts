import { randomBytes } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { pipeline } from "node:stream/promises";

export type ApiContext = {
  root: string;
};

type ApiRequest = IncomingMessage & { url?: string };

function safeResolve(root: string, requestPath: string): string {
  const resolved = path.resolve(root, "." + requestPath);
  const normalizedRoot = path.resolve(root) + path.sep;
  if (!resolved.startsWith(normalizedRoot) && resolved !== path.resolve(root)) {
    throw new Error("Path traversal rejected");
  }
  return resolved;
}

function json(response: ServerResponse, status: number, data: unknown): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(data));
}

function error(response: ServerResponse, status: number, message: string): void {
  json(response, status, { error: message });
}

async function readBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

async function listDir(
  root: string,
  dirPath: string,
): Promise<
  Array<{
    name: string;
    isDir: boolean;
    size: number;
    modified: string;
  }>
> {
  const fullPath = safeResolve(root, dirPath);
  const entries = await fs.readdir(fullPath, { withFileTypes: true });
  const results = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(fullPath, entry.name);
      const stat = await fs.stat(entryPath).catch(() => null);
      return {
        name: entry.name,
        isDir: entry.isDirectory(),
        size: stat?.size ?? 0,
        modified: stat ? stat.mtime.toISOString() : "",
      };
    }),
  );
  return results.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

async function archivePaths(root: string, paths: string[], archiveName: string): Promise<string> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const exec = promisify(execFile);
  const archiveId = randomBytes(8).toString("hex");
  const archivePath = path.join(root, `.${archiveName}.${archiveId}.zip`);
  const absolutePaths = paths.map((p) => safeResolve(root, p));
  await exec("zip", ["-r", archivePath, ...absolutePaths], {
    cwd: root,
  });
  return archivePath;
}

export async function handleApi(
  ctx: ApiContext,
  request: ApiRequest,
  response: ServerResponse,
): Promise<boolean> {
  const url = new URL(request.url ?? "/", "http://localhost");
  const route = url.pathname.replace(/^\/files/, "");
  const method = request.method ?? "GET";

  try {
    if (route === "/api/list" && method === "GET") {
      const dirPath = url.searchParams.get("path") ?? "/";
      const entries = await listDir(ctx.root, dirPath);
      json(response, 200, { entries, path: dirPath });
      return true;
    }

    if (route === "/api/download" && method === "GET") {
      const filePath = url.searchParams.get("path") ?? "";
      const fullPath = safeResolve(ctx.root, filePath);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        error(response, 400, "Cannot download a directory");
        return true;
      }
      response.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.basename(fullPath)}"`,
      );
      response.setHeader("Content-Length", stat.size.toString());
      const stream = createReadStream(fullPath);
      stream.pipe(response);
      return true;
    }

    if (route === "/api/upload" && method === "PUT") {
      const targetPath = url.searchParams.get("path") ?? "";
      const fullPath = safeResolve(ctx.root, targetPath);
      const write = createWriteStream(fullPath);
      await pipeline(request, write);
      json(response, 200, { ok: true });
      return true;
    }

    if (route === "/api/mkdir" && method === "POST") {
      const body = JSON.parse((await readBody(request)).toString()) as { path: string };
      const fullPath = safeResolve(ctx.root, body.path);
      await fs.mkdir(fullPath, { recursive: true });
      json(response, 200, { ok: true });
      return true;
    }

    if (route === "/api/delete" && method === "POST") {
      const body = JSON.parse((await readBody(request)).toString()) as { paths: string[] };
      for (const p of body.paths) {
        const fullPath = safeResolve(ctx.root, p);
        await fs.rm(fullPath, { recursive: true });
      }
      json(response, 200, { ok: true });
      return true;
    }

    if (route === "/api/archive" && method === "POST") {
      const body = JSON.parse((await readBody(request)).toString()) as {
        paths: string[];
        name: string;
      };
      const archivePath = await archivePaths(ctx.root, body.paths, body.name || "archive");
      const stat = await fs.stat(archivePath);
      response.setHeader("Content-Type", "application/zip");
      response.setHeader(
        "Content-Disposition",
        `attachment; filename="${body.name || "archive"}.zip"`,
      );
      response.setHeader("Content-Length", stat.size.toString());
      const stream = createReadStream(archivePath);
      stream.pipe(response);
      stream.on("close", () => fs.rm(archivePath, { force: true }));
      return true;
    }

    if (route === "/api/preview" && method === "GET") {
      const filePath = url.searchParams.get("path") ?? "";
      const fullPath = safeResolve(ctx.root, filePath);
      const stat = await fs.stat(fullPath);
      if (stat.size > 512 * 1024) {
        error(response, 400, "File too large for preview");
        return true;
      }
      const content = await fs.readFile(fullPath, "utf8");
      json(response, 200, { content, name: path.basename(fullPath), size: stat.size });
      return true;
    }

    return false;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    error(response, 400, message);
    return true;
  }
}
