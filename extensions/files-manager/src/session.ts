import { createHash, randomBytes } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";

const TICKET_TTL_MS = 60_000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const TICKET_QUERY = "openclawFilesTicket";
const SESSION_COOKIE = "openclaw_files_session";

export type MinimalSessionResponse = {
  setHeader: (name: string, value: string | number | readonly string[]) => void;
  end: (...args: unknown[]) => void;
  statusCode: number;
};

type IssuedTicket = {
  tokenHash: string;
  expiresAtMs: number;
};

type IssuedSession = {
  tokenHash: string;
  expiresAtMs: number;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function encodeToken(): string {
  return randomBytes(32).toString("base64url");
}

function deleteExpired(entries: Map<string, IssuedTicket | IssuedSession>, nowMs: number): void {
  for (const [tokenHash, entry] of entries) {
    if (entry.expiresAtMs <= nowMs) {
      entries.delete(tokenHash);
    }
  }
}

function requestUrl(request: IncomingMessage): URL | null {
  try {
    return new URL(request.url ?? "/", "http://localhost");
  } catch {
    return null;
  }
}

function readCookie(request: IncomingMessage, name: string): string | undefined {
  const header = request.headers.cookie;
  if (!header) {
    return undefined;
  }
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) {
      continue;
    }
    if (part.slice(0, separator).trim() === name) {
      try {
        return decodeURIComponent(part.slice(separator + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

function isSecureRequest(request: IncomingMessage): boolean {
  const socket = request.socket as { encrypted?: boolean };
  if (socket.encrypted === true) {
    return true;
  }
  return request.headers["x-forwarded-proto"] === "https";
}

function sendUnauthorized(response: MinimalSessionResponse): void {
  response.statusCode = 401;
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.end("OpenClaw Files session required");
}

export class FilesUiSession {
  private readonly tickets = new Map<string, IssuedTicket>();
  private readonly sessions = new Map<string, IssuedSession>();

  createTicket(nowMs = Date.now()): string {
    const token = encodeToken();
    this.tickets.set(hashToken(token), {
      tokenHash: hashToken(token),
      expiresAtMs: nowMs + TICKET_TTL_MS,
    });
    return token;
  }

  createSessionPath(basePath: string): string {
    const path = new URL(basePath, "http://localhost");
    path.searchParams.set(TICKET_QUERY, this.createTicket());
    return `${path.pathname}${path.search}`;
  }

  authorize(request: IncomingMessage, response: MinimalSessionResponse): boolean {
    const nowMs = Date.now();
    deleteExpired(this.tickets, nowMs);
    deleteExpired(this.sessions, nowMs);

    const url = requestUrl(request);
    if (!url) {
      sendUnauthorized(response);
      return false;
    }
    const ticket = url.searchParams.get(TICKET_QUERY);
    if (ticket) {
      const ticketHash = hashToken(ticket);
      const issuedTicket = this.tickets.get(ticketHash);
      this.tickets.delete(ticketHash);
      if (issuedTicket && issuedTicket.expiresAtMs > nowMs) {
        const sessionToken = encodeToken();
        this.sessions.set(hashToken(sessionToken), {
          tokenHash: hashToken(sessionToken),
          expiresAtMs: nowMs + SESSION_TTL_MS,
        });
        const secure = isSecureRequest(request) ? "; Secure" : "";
        response.setHeader(
          "Set-Cookie",
          `${SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; Path=/files; HttpOnly; SameSite=Strict${secure}`,
        );
        url.searchParams.delete(TICKET_QUERY);
        response.statusCode = 303;
        response.setHeader("Location", `${url.pathname}${url.search}`);
        response.setHeader("Cache-Control", "no-store");
        response.end();
        return false;
      }
    }

    const sessionToken = readCookie(request, SESSION_COOKIE);
    const session =
      sessionToken === undefined ? undefined : this.sessions.get(hashToken(sessionToken));
    if (!session || session.expiresAtMs <= nowMs) {
      if (sessionToken !== undefined) {
        this.sessions.delete(hashToken(sessionToken));
      }
      sendUnauthorized(response);
      return false;
    }
    return true;
  }

  authorizeUpgrade(request: IncomingMessage, socket: Duplex): boolean {
    return this.authorize(request, {
      statusCode: 401,
      setHeader: () => {},
      end: () => socket.destroy(),
    });
  }
}
