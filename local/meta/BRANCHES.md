# Active personal branches

Реестр личных веток форка поверх upstream `openclaw/openclaw`.

Схема и rationale — [fork-overlay-workflow.md](fork-overlay-workflow.md).
Детали по каждому патчу — [MY_PATCHES.md](MY_PATCHES.md).
Ветка `local/meta` мержится в `deploy` **последней**: её сгенерированные артефакты (config schema, plugin inventory) фиксируют итоговое состояние сборки.

| Branch                            | Type  | Purpose                                                          | Upstream PR |
| --------------------------------- | ----- | ---------------------------------------------------------------- | ----------- |
| feat/usage-footer-model           | feat  | Показ модели в usage-футере ответа                               | n/a         |
| feat/usage-footer-response-model  | feat  | Футер предпочитает `responseModel` провайдера, не запрос         | n/a         |
| feat/openai-chat-response-model   | feat  | JSON `chat.completion` fallback сохраняет модель из ответа       | n/a         |
| feat/usage-limits-custom-providers | feat | `/v1/limits` для custom providers с `baseUrl`                    | n/a         |
| feat/telegram-raw-tool            | feat  | `telegram_raw` agent tool (произвольные Bot API методы)          | n/a         |
| feat/telegram-healthcheck         | feat  | `pending_update_count` в Telegram probe                          | n/a         |
| feat/telegram-dm-topic-sessions   | feat  | Личные Telegram topics = отдельные сессии                        | n/a         |
| feat/extension-telegram-user      | feat  | Telegram user (MTProto) channel plugin                           | n/a         |
| feat/disable-cooldowns            | feat  | `disableCooldowns` per-model в `agents.defaults.models`          | n/a         |
| feat/usage-default-tokens         | feat  | Usage-футер показывается по умолчанию (`tokens`)                 | n/a         |
| feat/files-manager                | feat  | Files web manager в Control UI (vanilla runtime, 0 deps)         | n/a         |
| fix/telegram-required-replies     | fix   | Обязательные replies для inbound-ответов в Telegram              | n/a         |
| fix/telegram-readiness-healthcheck | fix  | Telegram readiness управляет docker healthcheck                  | n/a         |
| chore/personal-docker-amd64       | local | `personal-docker.yml`: сборка linux/amd64 → ghcr на push deploy  | n/a         |
| chore/pnpm-docker-build-approvals | local | pnpm `allowBuilds` для docker install scripts                    | n/a         |
| chore/pnpm-docker-prod-prune      | local | Docker prune гидратирует pnpm store + prune контракт-тест        | n/a         |
| local/meta                        | meta  | Этот реестр, MY_PATCHES.md, fork-overlay-workflow.md, реген-артефакты | n/a   |

## Recipe

Пересборка `deploy` (после upstream update или правки веток):

```bash
git fetch fork
git checkout main && git reset --hard fork/main

# Rebase каждой ветки из таблицы
for b in \
  feat/usage-footer-model \
  feat/usage-footer-response-model \
  feat/openai-chat-response-model \
  feat/usage-limits-custom-providers \
  feat/telegram-raw-tool \
  feat/telegram-healthcheck \
  feat/telegram-dm-topic-sessions \
  feat/extension-telegram-user \
  feat/disable-cooldowns \
  feat/usage-default-tokens \
  feat/files-manager \
  fix/telegram-required-replies \
  fix/telegram-readiness-healthcheck \
  chore/personal-docker-amd64 \
  chore/pnpm-docker-build-approvals \
  chore/pnpm-docker-prod-prune \
  local/meta \
; do
  git checkout $b && git rebase main
done

# Пересобрать deploy: reset + merge в порядке таблицы, local/meta — последним
git checkout deploy && git reset --hard main
git merge --no-ff feat/usage-footer-model
git merge --no-ff feat/usage-footer-response-model
git merge --no-ff feat/openai-chat-response-model
git merge --no-ff feat/usage-limits-custom-providers
git merge --no-ff feat/telegram-raw-tool
git merge --no-ff feat/telegram-healthcheck
git merge --no-ff feat/telegram-dm-topic-sessions
git merge --no-ff feat/extension-telegram-user
git merge --no-ff feat/disable-cooldowns
git merge --no-ff feat/usage-default-tokens
git merge --no-ff feat/files-manager
git merge --no-ff fix/telegram-required-replies
git merge --no-ff fix/telegram-readiness-healthcheck
git merge --no-ff chore/pnpm-docker-prod-prune
git merge --no-ff chore/personal-docker-amd64
git merge --no-ff chore/pnpm-docker-build-approvals
git merge --no-ff local/meta

# Проверка консистентности сгенерённых артефактов с итоговым деревом.
# Диффа быть не должно: артефакты живут на local/meta и обновляются там.
# Если диффа нет после изменения config-ключей — забыл реген: сделай его
# на local/meta и перемержи, не коммить в deploy руками.
pnpm config:schema:gen && pnpm config:channels:gen && pnpm config:docs:gen
pnpm plugins:inventory:gen
git status --short

# Push
git push --force-with-lease fork <each-rebased-branch> deploy
```

## Правила

- В `main` и `deploy` вручную не коммитим. `deploy` пересобирается из `main` + веток из таблицы выше.
- Одна тема — одна ветка. Новая ветка = новая строка в таблице + запись в `MY_PATCHES.md`.
- `local/meta` содержит только мета-доки и сгенерированные артефакты сборки; код — на тематических ветках.
- `rerere.enabled = true` в worktree.
- Upstream update на паузе (beta window): не фетчить upstream и не ребейзить на `upstream/main` до его окончания.
- Ветка ушла апстриму или умерла → удалить из таблицы, из `deploy` и из реестра.
