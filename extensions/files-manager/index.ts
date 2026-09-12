import path from "node:path";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import { createLazyRuntimeModule } from "openclaw/plugin-sdk/lazy-runtime";
import { resolvePluginConfigObject } from "openclaw/plugin-sdk/plugin-config-runtime";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { filesManagerConfigSchema, parseFilesManagerConfig } from "./src/config.js";
import { FILES_PATH } from "./src/server.js";
import { FilesUiSession, type MinimalSessionResponse } from "./src/session.js";

function resolveDefaultAgentId(config: OpenClawConfig): string {
  const agents = config.agents;
  const agentsList = agents?.list ?? [];
  const chosen = agentsList.find((agent) => agent.default) ?? agentsList[0];
  return chosen?.id?.trim() || "default";
}

function resolveRoot(params: {
  config: OpenClawConfig;
  pluginConfig?: Record<string, unknown>;
  resolveAgentWorkspaceDir: (config: OpenClawConfig, agentId: string) => string | undefined;
}): string {
  const configuredRoot = parseFilesManagerConfig(params.pluginConfig).root;
  if (configuredRoot) {
    return path.resolve(configuredRoot);
  }
  return path.resolve(
    params.resolveAgentWorkspaceDir(params.config, resolveDefaultAgentId(params.config)) ??
      process.cwd(),
  );
}

export default definePluginEntry({
  id: "files-manager",
  name: "Files",
  description: "Browse, upload, download, and archive workspace files from the Control UI.",
  configSchema: filesManagerConfigSchema,
  reload: {
    restartPrefixes: [
      "plugins.enabled",
      "plugins.allow",
      "plugins.deny",
      "plugins.entries.files-manager",
    ],
  },
  register(api) {
    const pluginConfig =
      api.pluginConfig ?? resolvePluginConfigObject(api.config, "files-manager") ?? {};
    const root = resolveRoot({
      config: api.config,
      pluginConfig,
      resolveAgentWorkspaceDir: api.runtime.agent.resolveAgentWorkspaceDir,
    });
    // CloudCmd binds Socket.IO engine state at construction; keep that runtime
    // out of metadata-only registration and plugin registration tests.
    const loadFilesServer = createLazyRuntimeModule(() =>
      import("./src/server.js").then(({ createFilesServer }) => createFilesServer({ root })),
    );
    const session = new FilesUiSession();
    const getFilesServer = async () => await loadFilesServer();

    api.registerGatewayMethod(
      "files-manager.controlUiSession",
      ({ respond }) => {
        respond(true, { path: session.createSessionPath(FILES_PATH) });
      },
      { scope: "operator.write" },
    );

    api.registerHttpRoute({
      path: FILES_PATH,
      // The gateway-issued one-time ticket becomes a plugin cookie. Gateway
      // bearer auth cannot protect the iframe's initial navigation directly.
      auth: "plugin",
      match: "prefix",
      handler: async (request, response) => {
        if (!session.authorize(request, response as MinimalSessionResponse)) {
          return;
        }
        (await getFilesServer()).handleHttpRequest(request, response);
      },
      handleUpgrade: async (request, socket, head) => {
        // WebSockets do not expose the cookie exchange used above, but browsers
        // attach same-origin HttpOnly cookies to upgrade requests.
        if (!session.authorizeUpgrade(request, socket)) {
          socket.destroy();
          return true;
        }
        return (await getFilesServer()).handleUpgrade(request, socket, head);
      },
    });

    api.session.controls.registerControlUiDescriptor({
      surface: "tab",
      id: "files",
      label: "Files",
      description: "Browse workspace files.",
      icon: "folder",
      group: "control",
      requiredScopes: ["operator.write"],
      path: FILES_PATH,
      schema: { auth: "gateway-session" },
    });
  },
});
