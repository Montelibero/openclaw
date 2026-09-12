import { isRecord, readStringValue as readString } from "openclaw/plugin-sdk/string-coerce-runtime";

export type FilesManagerConfig = {
  root?: string;
};

export function parseFilesManagerConfig(value: unknown): FilesManagerConfig {
  if (!isRecord(value)) {
    return {};
  }
  const root = readString(value.root);
  return root ? { root } : {};
}

export const filesManagerConfigSchema = {
  parse: parseFilesManagerConfig,
  uiHints: {
    root: {
      label: "Files Root",
      help: "Directory served by the Files tab. Defaults to the default agent workspace.",
    },
  },
};
