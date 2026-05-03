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

## Backlog (планируется)

- `feat/telegram-raw-tool` — прямой Bot API tool для агента. Источник clawdbot `043597e28` (только `telegram_raw` часть).
- `feat/telegram-healthcheck` — pending updates monitor + stale watchdog + getMe probe. Источник clawdbot `168f63434`, `94d075b59`, `2441cb579`, `69e9d6211`.
- `feat/extension-telegram-user` — порт extension `telegram-user` (MTProto user-account) по образцу `extensions/zalouser/`. Источник clawdbot `extensions/telegram-user/` (~1360 LOC).
- `chore/docker-startup-log` — startup-log SHA в stderr (опционально, если banner не устраивает). Источник clawdbot `81ba57102`.

См. также: `~/Projects/other/clawdbot/itolstov-contributions.md` (полный план переноса с категориями A/B/C/D).
