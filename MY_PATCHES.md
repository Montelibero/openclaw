# Local stack on top of upstream openclaw

This file tracks personal patches that ship on the `itolstov/integration` branch (and its `feat/*`/`chore/*` source branches) on top of the openclaw upstream `main`. Each entry is one feature, one branch.

Convention:

- `main` = clean mirror of `origin/main` (upstream openclaw). No personal commits.
- `feat/*`, `chore/*` = thematic source branches, atomic and rebaseable onto upstream.
- `chore/my-patches` = this file lives here on its own branch so it survives `itolstov/integration` rebuilds.
- `itolstov/integration` = `main` + merged `feat/*` + merged `chore/my-patches`; daily-driver, source for prod docker builds.

Update this file on `chore/my-patches` whenever a feat/chore branch lands on `itolstov/integration` (or gets dropped because upstream absorbed it). Then re-merge `chore/my-patches` into `itolstov/integration`.

Rebuild flow on upstream update:

```bash
git fetch origin
git checkout main && git reset --hard origin/main
for b in feat/usage-footer-model feat/usage-limits-custom-providers chore/my-patches; do
  git checkout $b && git rebase main
done
git checkout itolstov/integration && git reset --hard main
git merge --no-ff feat/usage-footer-model
git merge --no-ff feat/usage-limits-custom-providers
git merge --no-ff chore/my-patches
```

Source archive of older patches (from the previous fork `clawdbot`): see `~/Projects/other/clawdbot/itolstov-contributions.md`.

---

## feat/usage-footer-model — Show model in usage footer

**Status:** in-prod
**Source:** clawdbot `c69933cad` (Reply: show model in usage footer)
**Why:** видеть реальную модель в ответе бота — `Usage: 34k in / 51 out · model MiniMax-M2.7`.

**Changes:**

- `src/auto-reply/reply/agent-runner-usage-line.ts` — `formatResponseUsageLine` принимает `model?: string`, добавляет `· model X` (с обрезанием provider-префикса по `/`).
- `src/auto-reply/reply/agent-runner.ts` — callsite передаёт `model: modelUsed`.
- `src/auto-reply/reply/agent-runner.misc.runreplyagent.test.ts` — 2 теста: «shows model in footer», «strips provider prefix».

**Format:** `Usage: I in / O out · cache X cached / Y new · model M · est $X` (cache/cost опциональны).

---

## feat/usage-limits-custom-providers — `/v1/limits` для custom providers

**Status:** in-prod
**Source:** clawdbot `730e9cffd`, `4dc67f339`, `12e468ec7`
**Why:** показ usage limits в `openclaw models status` для любого custom provider с `baseUrl + apiKey` (OpenAI-совместимый endpoint, отдающий `/v1/limits`).

**Changes:**

- `src/infra/provider-usage.types.ts` — `UsageProviderId` расширен `(string & {})` для произвольных custom-id.
- `src/infra/provider-usage.shared.ts` — хелпер `getProviderLabel(id)` (label или fallback на id).
- `src/infra/provider-usage.fetch.custom.ts` — новый generic fetcher: `<baseUrl>/v1/limits` с Bearer-токеном, мапит `{key:{used,limit,resetAt}}` в `UsageWindow[]`.
- `src/infra/provider-usage.fetch.custom.test.ts` — 4 unit-теста (success / 404,405,501 = Unsupported / HTTP 502 / no token).
- `src/infra/provider-usage.fetch.ts` — re-export.
- `src/infra/provider-usage.auth.ts` — `ProviderAuth` получает опциональный `baseUrl`. `resolveProviderAuths` после iteration known-providers подбирает custom-провайдеров с `baseUrl` из `cfg.models.providers`.
- `src/infra/provider-usage.load.ts` — `fetchProviderUsageSnapshotFallback` при `auth.baseUrl` вызывает `fetchCustomUsage` вместо «Unsupported provider».
- `src/commands/models/list.status-command.ts` — OAuth/token блок включает custom-провайдеры (с `baseUrl`) рядом с oauthProfiles, скрывает entries без profiles И без usage.

**Test:** `pnpm test src/infra/provider-usage.fetch.custom.test.ts` — 4/4 ✓.

---

## feat/telegram-raw-tool — `telegram_raw` agent tool

**Status:** in-prod
**Source:** clawdbot `043597e28` (только `telegram_raw` часть, без `editMessage`)
**Why:** дать агенту прямой доступ к произвольным Telegram Bot API методам (`getChat`, `setMyCommands`, `getStickerSet` и т.п.) без отдельного action на каждый. Off-by-default; на каждый вызов требуется явный `acknowledgeRisk=true`.

**Changes:**

- `src/config/types.telegram.ts` — `TelegramAccountConfig.allowRawApi?: boolean`.
- `src/config/zod-schema.providers-core.ts` — `allowRawApi: z.boolean().optional()` в `TelegramAccountSchemaBase`.
- `extensions/telegram/openclaw.plugin.json` — `contracts.tools: ["telegram_raw"]`.
- `extensions/telegram/index.ts` — `registerFull(api) { api.registerTool(createTelegramRawTool(api)); }`.
- `extensions/telegram/src/raw-tool.ts` — **NEW**, `createTelegramRawTool(api)` с typebox-схемой `{action: "callApi", accountId?, acknowledgeRisk, apiMethod, args?, params?}`. Защита: regex + denylist для apiMethod (anti prototype-pollution), `acknowledgeRisk=true` обязателен, `account.config.allowRawApi=true` обязателен. `safeJson` обрабатывает bigints + circular refs.
- `extensions/telegram/src/raw-tool.test.ts` — **NEW**, 5 тестов.

**Использование:**

```jsonc
// config
{ "channels": { "telegram": { "allowRawApi": true } } }

// agent tool call
{
  "tool": "telegram_raw",
  "params": {
    "action": "callApi",
    "acknowledgeRisk": true,
    "apiMethod": "setMyCommands",
    "args": [[{"command": "start", "description": "Start"}]]
  }
}
```

**Tests:** `pnpm test extensions/telegram/src/raw-tool.test.ts` — 5/5 ✓. tsgo:core+extensions+test:src+test:extensions ✓. check:import-cycles + madge ✓.

---

## feat/telegram-healthcheck — pending update count в probe

**Status:** in-prod (минимальный объём — апстрим перекрыл основное)
**Source:** clawdbot `168f63434` (только часть про probe; остальное не нужно)
**Why:** видеть `pendingUpdateCount` в выводе `openclaw channels status` и других места, где используется TelegramProbe — диагностика, очередь не растёт ли.

**Что НЕ переносилось из исходных 4 коммитов и почему:**

- `94d075b59` (stale watchdog в monitor.ts) — апстрим перестроил polling. Есть `extensions/telegram/src/polling-liveness.ts` `TelegramPollingLivenessTracker.detectStall(...)` с per-call API tracking, in-flight detection и rebuild transport через `markTransportDirty()`. Намного богаче моей версии. Не переносим.
- `2441cb579` (getMe probe before stale-watchdog restart) — апстрим использует другой подход (consecutive timeouts + transport rebuild). getMe-probe тут не нужен. Не переносим.
- `69e9d6211` (absorb runner.task rejection) — в `polling-session.ts` rejection-обработка уже есть. Не переносим.
- Healthcheck endpoint в `server-http.ts` (часть `168f63434`) — апстрим имеет `/health` (live) + `/ready` (ready) split-архитектуру с `getReadiness`. Расширять `/health` с telegram-specific проверками не вписывается; внутренний stall recovery в polling-session достаточен (Docker restart не нужен — апстрим сам перезапустит polling). `Dockerfile` уже имеет `HEALTHCHECK`.

**Changes (только полезное):**

- `extensions/telegram/src/probe.ts` — `TelegramProbe.webhook.pendingUpdateCount?: number | null`, парсится из `pending_update_count` в getWebhookInfo.
- `extensions/telegram/src/probe.test.ts` — тест "captures pending_update_count from getWebhookInfo".

**Tests:** `pnpm test extensions/telegram/src/probe.test.ts` — 12/12 ✓. tsgo:extensions ✓.

---

## Backlog (планируется)

- `feat/extension-telegram-user` — порт extension `telegram-user` (MTProto user-account) по образцу `extensions/zalouser/`. Источник clawdbot `extensions/telegram-user/` (~1360 LOC).
- `chore/docker-startup-log` — startup-log SHA в stderr (опционально, если banner не устраивает). Источник clawdbot `81ba57102`.

См. также: `~/Projects/other/clawdbot/itolstov-contributions.md` (полный план переноса с категориями A/B/C/D).
