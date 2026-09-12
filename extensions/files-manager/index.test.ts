// Files plugin tests cover registration and the gateway-issued iframe session.
import { describe, expect, it, vi } from "vitest";
import plugin from "./index.js";
import manifest from "./openclaw.plugin.json" with { type: "json" };

function createApi() {
  const methods: Array<{
    name: string;
    handler: Parameters<Parameters<typeof plugin.register>[0]["registerGatewayMethod"]>[1];
    opts: Parameters<Parameters<typeof plugin.register>[0]["registerGatewayMethod"]>[2];
  }> = [];
  const routes: Array<Record<string, unknown>> = [];
  const descriptors: Array<Record<string, unknown>> = [];

  const api = {
    config: {
      agents: {
        list: [{ id: "default", default: true }],
      },
    },
    runtime: {
      agent: {
        resolveAgentWorkspaceDir: vi.fn(() => "/tmp/openclaw-workspace"),
      },
    },
    registerGatewayMethod: (
      name: string,
      handler: (parameters: unknown) => unknown,
      opts: unknown,
    ) => {
      methods.push({
        name,
        handler: handler as never,
        opts: opts as never,
      });
    },
    registerHttpRoute: (route: Record<string, unknown>) => {
      routes.push(route);
    },
    session: {
      controls: {
        registerControlUiDescriptor: (descriptor: Record<string, unknown>) => {
          descriptors.push(descriptor);
        },
      },
    },
  };

  return {
    api: api as unknown as Parameters<typeof plugin.register>[0],
    descriptors,
    methods,
    routes,
  };
}

describe("files-manager plugin entry", () => {
  it("declares an enabled bundled plugin", () => {
    expect(manifest).toMatchObject({
      id: "files-manager",
      enabledByDefault: true,
      activation: { onStartup: true },
    });
  });

  it("registers a gateway session method, embedded UI route, and tab", () => {
    const { api, descriptors, methods, routes } = createApi();
    plugin.register(api);

    expect(methods).toHaveLength(1);
    expect(methods[0]).toMatchObject({
      name: "files-manager.controlUiSession",
      opts: { scope: "operator.write" },
    });
    expect(routes).toEqual([
      expect.objectContaining({
        path: "/files",
        auth: "plugin",
        match: "prefix",
      }),
    ]);
    expect(descriptors).toEqual([
      expect.objectContaining({
        surface: "tab",
        id: "files",
        path: "/files",
        schema: { auth: "gateway-session" },
        requiredScopes: ["operator.write"],
      }),
    ]);
  });
});
