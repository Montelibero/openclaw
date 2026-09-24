import { defineBundledChannelEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelEntry({
  id: "telegram-user",
  name: "Telegram User",
  description: "Telegram user (MTProto) channel plugin",
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "telegramUserPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setTelegramUserRuntime",
  },
});
