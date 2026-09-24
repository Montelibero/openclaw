---
summary: "Browse, upload, download, and archive files in Control UI"
read_when:
  - You want a workspace file manager in the Control UI
  - You are configuring or auditing the bundled Files plugin
title: "Files plugin"
---

The Files plugin embeds Cloud Commander in a Control UI tab. It can browse the
configured root, download files, upload files, and create archives. The plugin
is bundled in the Docker image, so users do not need to install or build plugin
dependencies at Gateway startup.

The Files tab is visible to Control UI connections with `operator.write`. The
dashboard requests a plugin session over the authenticated Gateway connection;
the plugin exchanges that request for a short-lived, one-time ticket, then sets
an HttpOnly `SameSite=Strict` cookie scoped to `/files`. Cloud Commander and its
Socket.IO traffic use that cookie. The plugin leaves Cloud Commander credentials
disabled because the OpenClaw-issued browser session owns authentication.

## Configure

```json5
{
  gateway: {
    controlUi: {
      // The embedded file manager needs scripts and same-origin access for
      // cookies and its Socket.IO connection.
      embedSandbox: "trusted",
    },
  },
  plugins: {
    entries: {
      "files-manager": {
        enabled: true,
        config: {
          root: "/data/workspace",
        },
      },
    },
  },
}
```

`root` defaults to the default agent workspace. Set it to a directory mounted
into the container when uploads and archives must persist. The configured root
is the filesystem boundary exposed by the file manager.

For the personal Docker image, `OPENCLAW_EXTENSIONS=files-manager` installs the
plugin dependencies at image build time. Restart the Gateway after changing the
root or embed sandbox:

```bash
openclaw gateway restart
openclaw plugins inspect files-manager --runtime --json
```

Open the Control UI and select **Files**. If the tab stays static, check that
`gateway.controlUi.embedSandbox` is `trusted`; stricter embed modes intentionally
block plugin scripts.
