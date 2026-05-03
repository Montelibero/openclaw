import type { AssistantMessage } from "@mariozechner/pi-ai";
import { describe, expect, it } from "vitest";
import {
  resolveFinalAssistantRawText,
  resolveFinalAssistantVisibleText,
  resolveReportedModelRef,
} from "./helpers.js";

function makeAssistantMessage(
  content: AssistantMessage["content"],
  phase?: string,
): AssistantMessage {
  return {
    api: "responses",
    provider: "openai",
    model: "gpt-5.4",
    usage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
    role: "assistant",
    content,
    timestamp: Date.now(),
    stopReason: "stop",
    ...(phase ? { phase } : {}),
  };
}

describe("resolveFinalAssistantVisibleText", () => {
  it("prefers final_answer text over commentary blocks", () => {
    const lastAssistant = makeAssistantMessage([
      {
        type: "text",
        text: "Working...",
        textSignature: JSON.stringify({ v: 1, id: "item_commentary", phase: "commentary" }),
      },
      {
        type: "text",
        text: "Section 1\nSection 2",
        textSignature: JSON.stringify({ v: 1, id: "item_final", phase: "final_answer" }),
      },
    ]);

    expect(resolveFinalAssistantVisibleText(lastAssistant)).toBe("Section 1\nSection 2");
  });

  it("returns undefined when the final visible text is empty", () => {
    const lastAssistant = makeAssistantMessage([
      {
        type: "text",
        text: "Working...",
        textSignature: JSON.stringify({ v: 1, id: "item_commentary", phase: "commentary" }),
      },
      {
        type: "text",
        text: "   ",
        textSignature: JSON.stringify({ v: 1, id: "item_final", phase: "final_answer" }),
      },
    ]);

    expect(resolveFinalAssistantVisibleText(lastAssistant)).toBeUndefined();
  });

  it("preserves raw final answer text without visible-text sanitization", () => {
    const lastAssistant = makeAssistantMessage([
      {
        type: "text",
        text: "<final>keep this</final>",
        textSignature: JSON.stringify({ v: 1, id: "item_final", phase: "final_answer" }),
      },
    ]);

    expect(resolveFinalAssistantRawText(lastAssistant)).toBe("<final>keep this</final>");
  });
});

describe("resolveReportedModelRef", () => {
  it("prefers responseModel over assistant.model when both differ from request", () => {
    const ref = resolveReportedModelRef({
      provider: "custom",
      model: "default_combo",
      assistant: { provider: "custom", model: "default_combo", responseModel: "kimi-for-coding" },
    });
    expect(ref).toEqual({ provider: "custom", model: "kimi-for-coding" });
  });

  it("falls back to assistant.model when responseModel is missing", () => {
    const ref = resolveReportedModelRef({
      provider: "openai",
      model: "gpt-5.4",
      assistant: { provider: "openai", model: "gpt-5.4-2026-01" },
    });
    expect(ref).toEqual({ provider: "openai", model: "gpt-5.4-2026-01" });
  });

  it("falls back to request model when both responseModel and assistant.model are absent", () => {
    const ref = resolveReportedModelRef({
      provider: "anthropic",
      model: "claude",
      assistant: { provider: "anthropic" },
    });
    expect(ref).toEqual({ provider: "anthropic", model: "claude" });
  });

  it("uses request model when assistant has no provider (preserves prior behavior)", () => {
    const ref = resolveReportedModelRef({
      provider: "custom",
      model: "default_combo",
      assistant: { responseModel: "kimi-for-coding" },
    });
    expect(ref).toEqual({ provider: "custom", model: "kimi-for-coding" });
  });

  it("ignores responseModel for embedded harness provider (stays on request model)", () => {
    const ref = resolveReportedModelRef({
      provider: "openai",
      model: "gpt-5.4",
      assistant: { provider: "pi", model: "gpt-5.4-2026-01", responseModel: "should-be-ignored" },
    });
    expect(ref).toEqual({ provider: "openai", model: "gpt-5.4" });
  });
});
