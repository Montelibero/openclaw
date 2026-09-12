import { IncomingMessage, ServerResponse } from "node:http";
// Session tests cover one-time ticket exchange and cookie replay.
import { describe, expect, it, vi } from "vitest";
import { FilesUiSession } from "./session.js";

function createRequest(url: string, cookie?: string): IncomingMessage {
  const request = new IncomingMessage({
    encrypted: false,
  } as never);
  request.url = url;
  if (cookie) {
    request.headers.cookie = cookie;
  }
  return request;
}

function createResponse() {
  const response = new ServerResponse(createRequest("/") as never);
  return response;
}

describe("FilesUiSession", () => {
  it("exchanges a one-time ticket for a path-scoped cookie", () => {
    const session = new FilesUiSession();
    const sessionPath = session.createSessionPath("/files");
    const ticket = new URL(sessionPath, "http://localhost").searchParams.get("openclawFilesTicket");
    expect(ticket).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const response = createResponse();
    const setHeader = vi.spyOn(response, "setHeader");
    const end = vi.spyOn(response, "end").mockImplementation(() => response as never);
    const authorized = session.authorize(
      createRequest(sessionPath),
      response as unknown as Parameters<typeof session.authorize>[1],
    );

    expect(authorized).toBe(false);
    expect(response.statusCode).toBe(303);
    expect(response.getHeader("location")).toBe("/files");
    const cookie = String(setHeader.mock.calls.find(([name]) => name === "Set-Cookie")?.[1]);
    expect(cookie).toContain("Path=/files");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(end).toHaveBeenCalled();
  });

  it("authorizes the issued cookie once and rejects a replayed ticket", () => {
    const session = new FilesUiSession();
    const sessionPath = session.createSessionPath("/files");
    const firstResponse = createResponse();
    vi.spyOn(firstResponse, "end").mockImplementation(() => firstResponse as never);
    session.authorize(
      createRequest(sessionPath),
      firstResponse as unknown as Parameters<typeof session.authorize>[1],
    );
    const cookie = String(firstResponse.getHeader("Set-Cookie")).split(";")[0];

    expect(
      session.authorize(
        createRequest("/files/dist/cloudcmd.common.js", cookie),
        createResponse() as unknown as Parameters<typeof session.authorize>[1],
      ),
    ).toBe(true);
    expect(
      session.authorize(
        createRequest(sessionPath),
        createResponse() as unknown as Parameters<typeof session.authorize>[1],
      ),
    ).toBe(false);
  });
});
