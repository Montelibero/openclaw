---
summary: "Browse, upload, download, and archive workspace files from the Control UI."
read_when:
  - You are installing, configuring, or auditing the files-manager plugin
title: "Files Manager plugin"
---

# Files Manager plugin

Browse, upload, download, and archive workspace files from the Control UI.

## Distribution

- Package: `@openclaw/files-manager`
- Install route: included in OpenClaw

## Surface

plugin

<!-- openclaw-plugin-reference:manual-start -->

Cloud Commander for browsing, upload, download, and archive operations.

## Configuration

- `root`: filesystem root exposed by the tab. Defaults to the default agent
  workspace.

The tab requires `operator.write`. See [Files plugin](/plugins/files-manager)
for authentication and sandbox details.

<!-- openclaw-plugin-reference:manual-end -->

## Related docs

- [files-manager](/plugins/files-manager)
