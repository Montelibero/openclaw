import { html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type { GatewayBrowserClient } from "../api/gateway.ts";

type ControlUiSessionResponse = {
  path?: unknown;
};

function readSessionPath(value: unknown): string | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const path = (value as ControlUiSessionResponse).path;
  if (
    typeof path !== "string" ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/\\")
  ) {
    return null;
  }
  return path;
}

/**
 * Opens a gateway-session plugin frame. The plugin exchanges its authenticated
 * Control UI connection for a short-lived browser session; the raw path is only
 * a fallback when the optional session method fails.
 */
export class GatewayPluginFrame extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) client: GatewayBrowserClient | null = null;
  @property() pluginId = "";
  @property() tabId = "";
  @property() path = "";
  @property() label = "";
  @property() connected = false;
  @property() sandbox = "allow-scripts allow-same-origin allow-forms allow-popups";

  @state() private framePath: string | null = null;
  @state() private pending = false;

  private loadGeneration = 0;
  private loadedFor = "";

  override connectedCallback() {
    super.connectedCallback();
    void this.loadSessionPath();
  }

  override willUpdate(changedProperties: Map<string, unknown>) {
    if (
      ["client", "pluginId", "tabId", "path", "connected"].some((name) =>
        changedProperties.has(name),
      )
    ) {
      void this.loadSessionPath();
    }
  }

  private async loadSessionPath() {
    const identity = `${this.pluginId}:${this.tabId}:${this.connected ? "connected" : "disconnected"}`;
    if (this.loadedFor === identity || !this.connected || !this.client) {
      return;
    }
    const generation = ++this.loadGeneration;
    this.loadedFor = identity;
    this.pending = true;
    try {
      const response = await this.client.request(`${this.pluginId}.controlUiSession`, {
        tabId: this.tabId,
      });
      const sessionPath = readSessionPath(response);
      if (generation !== this.loadGeneration) {
        return;
      }
      this.framePath = sessionPath;
    } catch {
      if (generation !== this.loadGeneration) {
        return;
      }
      this.framePath = null;
    } finally {
      if (generation === this.loadGeneration) {
        this.pending = false;
      }
    }
  }

  override render() {
    if (this.pending && !this.framePath) {
      return html`<section class="card lazy-view-state" role="status">
        <div class="card-title">…</div>
      </section>`;
    }
    const path = this.framePath ?? this.path;
    if (!path) {
      return nothing;
    }
    return html`
      <section class="plugin-tab-embed">
        <iframe
          class="plugin-tab-embed__frame"
          src=${path}
          title=${this.label}
          sandbox=${this.sandbox}
        ></iframe>
      </section>
    `;
  }
}

if (!customElements.get("openclaw-gateway-plugin-frame")) {
  customElements.define("openclaw-gateway-plugin-frame", GatewayPluginFrame);
}
