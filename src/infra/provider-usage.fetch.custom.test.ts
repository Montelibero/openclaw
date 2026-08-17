import { describe, expect, it } from "vitest";
import { createProviderUsageFetch, makeResponse } from "../test-utils/provider-usage-fetch.js";
import { fetchCustomUsage } from "./provider-usage.fetch.custom.js";

describe("fetchCustomUsage", () => {
  it("hits <baseUrl>/v1/limits with bearer token and maps used/limit windows", async () => {
    const mockFetch = createProviderUsageFetch(async (url, init) => {
      expect(url).toBe("https://example.test/v1/limits");
      const headers = (init?.headers as Record<string, string> | undefined) ?? {};
      expect(headers.Authorization).toBe("Bearer secret");
      return makeResponse(200, {
        daily: { used: 250, limit: 1000, resetAt: 1234 },
        monthly: { used: 4000, limit: 10000 },
        // ignored entries below
        plan: "pro",
        invalid: { used: 1 },
      });
    });

    const result = await fetchCustomUsage(
      "custom",
      "https://example.test",
      "secret",
      1000,
      mockFetch,
    );
    expect(result.provider).toBe("custom");
    expect(result.error).toBeUndefined();
    expect(result.windows).toEqual([
      { label: "daily", usedPercent: 25, resetAt: 1234 },
      { label: "monthly", usedPercent: 40, resetAt: undefined },
    ]);
  });

  it("returns Unsupported provider on 404/405/501", async () => {
    for (const status of [404, 405, 501]) {
      const mockFetch = createProviderUsageFetch(async () => makeResponse(status, "nope"));
      const result = await fetchCustomUsage("custom", "https://example.test", "k", 500, mockFetch);
      expect(result.error).toBe("Unsupported provider");
      expect(result.windows).toEqual([]);
    }
  });

  it("returns HTTP <status> for other failures", async () => {
    const mockFetch = createProviderUsageFetch(async () => makeResponse(502, "bad"));
    const result = await fetchCustomUsage("custom", "https://example.test", "k", 500, mockFetch);
    expect(result.error).toBe("HTTP 502");
  });

  it("omits Authorization when token is empty", async () => {
    const mockFetch = createProviderUsageFetch(async (_url, init) => {
      const headers = (init?.headers as Record<string, string> | undefined) ?? {};
      expect(headers.Authorization).toBeUndefined();
      return makeResponse(200, {});
    });
    const result = await fetchCustomUsage("custom", "https://example.test", "", 500, mockFetch);
    expect(result.error).toBeUndefined();
    expect(result.windows).toEqual([]);
  });
});
