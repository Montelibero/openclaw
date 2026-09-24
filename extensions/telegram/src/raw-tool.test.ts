import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTelegramRawTool } from "./raw-tool.js";

const { botApi, botCtor } = vi.hoisted(() => {
  const api: Record<string, unknown> = {};
  const ctor = vi.fn();
  return { botApi: api, botCtor: ctor };
});

vi.mock("grammy", () => ({
  Bot: class {
    api = botApi;
    constructor(token: string) {
      botCtor(token);
    }
  },
}));

function buildApi(cfg: Record<string, unknown>): OpenClawPluginApi {
  return createTestPluginApi({
    config: cfg as never,
    runtime: {
      config: {
        current: () => cfg,
        loadConfig: () => cfg,
        mutateConfigFile: async () => undefined,
        replaceConfigFile: async () => undefined,
        writeConfigFile: async () => undefined,
      },
    } as never,
  });
}

describe("createTelegramRawTool", () => {
  beforeEach(() => {
    for (const key of Object.keys(botApi)) {
      delete botApi[key];
    }
    botCtor.mockClear();
  });

  it("requires acknowledgeRisk=true", async () => {
    const cfg = { channels: { telegram: { botToken: "tok", allowRawApi: true } } };
    const tool = createTelegramRawTool(buildApi(cfg));
    await expect(
      tool.execute!("1", {
        action: "callApi",
        apiMethod: "sendMessage",
        args: ["123", "hi"],
      }),
    ).rejects.toThrow(/acknowledgeRisk=true is required/);
  });

  it("respects allowRawApi gating", async () => {
    const cfg = { channels: { telegram: { botToken: "tok", allowRawApi: false } } };
    const tool = createTelegramRawTool(buildApi(cfg));
    await expect(
      tool.execute!("1", {
        action: "callApi",
        acknowledgeRisk: true,
        apiMethod: "sendMessage",
        args: ["123", "hi"],
      }),
    ).rejects.toThrow(/Raw Telegram Bot API access is disabled/);
  });

  it("fails for unknown methods", async () => {
    const cfg = { channels: { telegram: { botToken: "tok", allowRawApi: true } } };
    const tool = createTelegramRawTool(buildApi(cfg));
    await expect(
      tool.execute!("1", {
        action: "callApi",
        acknowledgeRisk: true,
        apiMethod: "notRealMethod",
      }),
    ).rejects.toThrow(/Unknown Telegram Bot API method/);
  });

  it("rejects prototype-pollution-style method names", async () => {
    const cfg = { channels: { telegram: { botToken: "tok", allowRawApi: true } } };
    const tool = createTelegramRawTool(buildApi(cfg));
    await expect(
      tool.execute!("1", {
        action: "callApi",
        acknowledgeRisk: true,
        apiMethod: "__proto__",
      }),
    ).rejects.toThrow(/Invalid apiMethod/);
  });

  it("calls bot.api methods with args", async () => {
    const sendMessage = vi.fn(async () => ({ message_id: 77 }));
    botApi.sendMessage = sendMessage;
    const cfg = { channels: { telegram: { botToken: "tok", allowRawApi: true } } };
    const tool = createTelegramRawTool(buildApi(cfg));

    const result = await tool.execute!("1", {
      action: "callApi",
      acknowledgeRisk: true,
      apiMethod: "sendMessage",
      args: ["123", "hello"],
    });

    expect(botCtor).toHaveBeenCalledWith("tok");
    expect(sendMessage).toHaveBeenCalledWith("123", "hello");
    expect(result.content).toContainEqual({
      type: "text",
      text: expect.stringContaining('"ok": true'),
    });
  });
});
