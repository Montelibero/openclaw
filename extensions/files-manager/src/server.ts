import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import type { Duplex } from "node:stream";
import cloudcmd from "cloudcmd";
import { Server as SocketIoServer } from "socket.io";

export const FILES_PATH = "/files";
const SOCKET_PATH = `${FILES_PATH}/socket.io`;

export type FilesServer = {
  handleHttpRequest: (request: IncomingMessage, response: ServerResponse) => void;
  handleUpgrade: (request: IncomingMessage, socket: Duplex, head: Buffer) => boolean;
};

type CloudCmdMiddleware = (request: IncomingMessage, response: ServerResponse) => void;

type CloudCmdRequest = IncomingMessage & {
  baseUrl?: string;
};

function mountCloudCmdRequest(request: IncomingMessage): CloudCmdRequest {
  const mounted = request as CloudCmdRequest;
  const url = new URL(mounted.url ?? "/", "http://localhost");
  const suffix = url.pathname === FILES_PATH ? "/" : url.pathname.slice(FILES_PATH.length);
  mounted.url = `${suffix}${url.search}`;
  mounted.baseUrl = FILES_PATH;
  return mounted;
}

export function createFilesServer(params: { root: string }): FilesServer {
  const io = new SocketIoServer({
    path: SOCKET_PATH,
    // Auth is enforced before CloudCmd sees the request; its own credential UI is disabled.
    cors: { origin: false },
  });
  const middleware = cloudcmd({
    socket: io,
    config: {
      root: path.resolve(params.root),
      prefix: FILES_PATH,
      prefixSocket: SOCKET_PATH,
      auth: false,
      open: false,
      online: false,
      console: false,
      terminal: false,
      contact: false,
      configDialog: false,
      configAuth: false,
      configPort: false,
      dropbox: false,
      export: false,
      import: false,
    },
  }) as CloudCmdMiddleware;

  return {
    handleHttpRequest(request, response) {
      middleware(mountCloudCmdRequest(request), response);
    },
    handleUpgrade(request, socket, head) {
      const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
      if (pathname !== SOCKET_PATH && !pathname.startsWith(`${SOCKET_PATH}/`)) {
        return false;
      }
      io.engine.handleUpgrade(request, socket, head);
      return true;
    },
  };
}
