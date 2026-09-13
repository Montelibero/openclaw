import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { handleApi, type ApiContext } from "./api.js";
import { FILES_HTML } from "./web-html.js";

export const FILES_PATH = "/files";

export type FilesServer = {
  handleHttpRequest: (request: IncomingMessage, response: ServerResponse) => void;
};

export function createFilesServer(params: { root: string }): FilesServer {
  const root = path.resolve(params.root);
  fs.mkdirSync(root, { recursive: true });
  const ctx: ApiContext = { root };
  const html = FILES_HTML;

  return {
    handleHttpRequest(request, response) {
      const url = new URL(request.url ?? "/", "http://localhost");
      const routePath = url.pathname.replace(/^\/files/, "") || "/";

      if (routePath === "/" || routePath === "") {
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.setHeader("Cache-Control", "no-cache");
        response.end(html);
        return;
      }

      const handled = handleApi(ctx, request as IncomingMessage & { url?: string }, response);
      if (!handled) {
        response.statusCode = 404;
        response.setHeader("Content-Type", "text/plain; charset=utf-8");
        response.end("Not found");
      }
    },
  };
}
