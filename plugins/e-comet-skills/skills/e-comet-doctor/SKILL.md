---
name: e-comet-doctor
description: Use when e-Comet installation, local MCP startup, browser extension routing, storage, report creation, upload, or host hook behavior fails or remains uncertain, and when the user says e-Comet tools are missing, not answering, asking to sign in, or "worked before".
---

# e-Comet doctor

Base every conclusion on an observed typed result. Absence of a local tool can be a valid remote-only installation and does not prove a broken full installation.

## Triage before any conclusion

Both hosts load tools on demand. Search the host tool catalog for `e-comet` with a large result limit, or search by
exact tool name. A fresh task's start list proves nothing. A truncated search result does not prove absence; use the
host's supported bounded search again or search for the exact capability before calling it unavailable.

| Observed after search | Meaning | Next step |
| --- | --- | --- |
| No e-Comet tools | Installation or enablement is uncertain; in Cowork the remote connector may also be disconnected | Cowork: call host `ListConnectors` filtered for e-Comet. If `ListConnectors` shows the connector connected, verify in Customize → Plugins → Yours that e-Comet MCP Tools is installed and enabled, answer any local MCP permission prompt with Continue, and start a new task. Codex: use the [README fallback](https://github.com/e-comet/skills#troubleshooting) to check marketplace, plugin installation and enablement, then start a new task. No local probe is available. |
| Local tools present, remote tools absent | Remote authorization, chat enablement, or connection is uncertain | Codex: call installation `e_comet_diagnose` with `safe_probes` and `codex_mcp_auth`. Cowork: call `ListConnectors`. Apply the connector rules below. |
| Both present | Tools are visible in this task | Continue with the numbered steps below. |

The extension connects through the local MCP. When the local MCP is absent, first resolve that host route; extension
checks cannot explain the missing local tools.

## Household cases

When a row matches an observed typed result, give that action and stop probing. A user prerequisite (install, enable, open, activate, sign in, connect, update, trust hooks) is not an unexpected failure: do not offer a bug report unless the action was done and the same failure repeats. `retryDisposition` governs repeats; `retryable:true` never authorizes an automatic repeat. Say the action in the user's language; the Russian phrase is the shape, not a script.

| Observed | Meaning | User action |
| --- | --- | --- |
| `BRIDGE_NO_BROWSER` (status `code` or tool error) | No browser started the e-Comet connector: the browser may be closed or e-Comet may await a permission | Open the named browser; if it is open, click the e-Comet icon and accept the permission under «Требуется действие» if shown, then repeat. For an Ozon route use its typed result instead. «Откройте браузер с расширением e-Comet и нажмите на значок e-Comet; если браузер показывает «Требуется действие», нажмите там «Разрешить».» |
| `BRIDGE_PERMISSION_REQUIRED` | The browser keeps e-Comet off until its new permission is accepted | In the named browser: «Требуется действие» right of the address bar (or the ⋮ menu) → «Расширение "e-Comet" отключено» → «Разрешить», then repeat. «Нажмите «Требуется действие» справа от адресной строки, затем «Разрешить» для e-Comet, и повторим.» |
| `BRIDGE_EXTENSION_OUTDATED` or `BRIDGE_EXTENSION_DISABLED` | Extension too old for this plugin, or turned off | Outdated: apply the update offered on app.e-comet.io or restart the browser, then press «Разрешить» when asked. Disabled: turn e-Comet on in the browser's extensions page. |
| Another `BRIDGE_*` code | Cause observed by the local bridge | Give the step DIAGNOSTICS.md names for that code. For `BRIDGE_BROKER_FAILED` and `BRIDGE_FRAME_TOO_LARGE` there is no user step: offer a report to e-Comet without naming a cause. |
| `extension_install` with `profiles:[]` in every checked browser, `readFailures:0` | Not installed in the checked browsers; other browsers unchecked | Ask which browser the user works in. If it is a checked browser, install from https://chromewebstore.google.com/detail/e-comet/apeallgchpgibifmbgefkhifidihmodh; if it is an unchecked Chromium browser, ask whether the extension is installed and enabled there; Firefox is unsupported. «Расширение e-Comet не найдено в проверенных браузерах. В каком браузере вы работаете?» |
| Listed profiles all `state:"disabled"`, none `unknown`, `readFailures:0` | Installed but disabled in that browser; with `permissionsIncrease:true` it awaits acceptance of a new permission | Enable it on the browser's extensions page; with `permissionsIncrease:true`, accept the new permission in the browser instead. «Расширение найдено, но выключено. Включите его на странице расширений.» |
| `browserJobRejection.reason:"ecomet_not_authenticated"` | Extension not activated with an API key | Activate it with the API key from https://app.e-comet.io/account in the browser where it is connected. «Расширение не активировано: введите в нём API-ключ из аккаунта e-Comet в том браузере, где оно установлено.» |
| `BROWSER_JOB_ACCOUNT_MISMATCH` (`reason:"subject_mismatch"`) | Extension activated with a different e-Comet account than the connector | Use the same e-Comet account on both: re-activate the extension with that account's key, or connect the connector with the extension's account. «Расширение активировано другим аккаунтом e-Comet, чем подключён здесь. Активируйте его ключом того же аккаунта или подключите здесь аккаунт из расширения.» |
| `errorDetails.code:"WB_NOT_AUTHENTICATED"` on a product unit | No Wildberries session in the page that made the request | Sign in to wildberries.ru in the browser and profile where the extension is connected. «Войдите в свой аккаунт на wildberries.ru в браузере с расширением e-Comet, потом повторим.» |
| `SELLER_LOGIN_REQUIRED` | No seller-portal session | The typed message already says it: sign in to the Wildberries seller portal in that browser. |
| `BROWSER_JOB_HANDOFF_REQUIRED`, or Ozon `OZON_AUTHORIZATION_REJECTED` with "The trusted browser-job hook did not provide Ozon authorization." | The host hook did not provide the authorization: plugin hooks not trusted, disabled, changed after an update, or not run by the host in this task | Never repeat `browser_job` automatically. Codex: run installation `hook_permissions`; on `disabled` or `review_required` send the user to Settings → Plugins → Personal → e-Comet MCP Tools → Hooks to enable or trust the e-Comet handlers; on `ready` or `not_checked` say the cause is not established and offer a retry on the user's decision or a report. Cowork: verify the plugin in Customize → Plugins → Yours and start a new task. «Плагин не смог передать разрешение браузеру. Проверю настройки хуков e-Comet в Codex и скажу, что сделать.» Then, for a disabled or review-required handler: «Откройте Settings → Plugins → Personal → e-Comet MCP Tools → Hooks и подтвердите хуки e-Comet, потом повторим.» |
| `OZON_ROUTE_NOT_READY` with `details.reason:"extension_outdated"` | Extension older than the Ozon minimum | Update the extension at `details.updateUrl` to `details.requiredExtensionVersion`; do not open the report page. «Обновите расширение e-Comet до версии из ответа по ссылке оттуда же; страницу Ozon открывать не нужно.» |
| Remote tools absent after search; Codex `codex_mcp_auth` `not_logged_in`, or Cowork `installState` other than `connected` | Codex configuration shows sign-in not completed; Cowork reports the connector not connected; firm wording only after a host authorization error | Codex: Settings → Plugins → e-Comet MCP Tools → server E-comet → Connect. «По настройкам Codex вход в e-Comet не выполнен: откройте настройки плагина и нажмите Connect у сервера E-comet.» Cowork: plugin card → Connectors → Connect. «Коннектор e-Comet не подключён: нажмите Connect в карточке плагина.» |
| Cowork `installState:"connected"`, `enabledInChat:false` | Connector connected but disabled for this chat | Ask the user to enable e-Comet for this chat; the exact control is an unverified UI detail, describe the action and name no control. «Коннектор e-Comet подключён, но выключен для этого чата: включите его в этом чате.» |
| Only remote tools after search | Basic installation, or a full one whose local MCP did not start | Ask which installation was intended (README: Базовая / Полная); for a full one use the README fallback. |

## Remote connector rules

Give the connector action in the first answer where its evidence appears. A firm authorization conclusion requires
a remote call's host authorization error or a
host system notice naming authorization. Say e-Comet is not authorized and ask the user to connect the remote
connector; until then analytics, live data and reports are unavailable. Cowork `ListConnectors.installState` other
than `connected` supports the distinct conclusion that its connector is not connected, with the Connect action.
Codex `facts.status:"not_logged_in"` supports the qualified wording "According to the
Codex configuration, e-Comet sign-in was not completed" with the same action. `credentials_present` proves only
stored credentials: call `info` if available, and let its host authorization error outrank the snapshot. `missing`,
`ambiguous`, `unknown_status`, and `not_checked` support no authorization claim. Without stronger
evidence, say only that remote tools are not visible and check whether the connector is connected and authorized.

In Cowork `installState:"connected"` with `enabledInChat:false` means connected but disabled for this chat. Ask the
user to enable it for this chat, not to sign in; the per-chat control has no verified label, so describe the action
and name no control. Cowork's Connect action is on the plugin card under Connectors (or
the Connect button on the connectors card). Codex in ChatGPT Desktop: Settings → Plugins → e-Comet MCP Tools →
server E-comet → Connect. Do not give a CLI command as the user's Desktop action. Before concluding that the
remote server is down or answering about a particular organization, call `info` when available: inspect subscription
tier and expiry, and that organization's `read` flag. An expired subscription or absent readable organization is a
specific observation, not a server-down diagnosis. A stored-credentials snapshot or a host `connected` status
before a real call does not establish that the call will succeed.

Only when remote tools fail with an observed network error while local tools work, suggest checking the host's
network permission as a candidate: `Allow network egress` in Cowork, `Allow network access` in Codex. Neither
permission is a diagnosed cause from tool absence alone.

For feedback sending or feedback-specific recovery, call `describe_e_comet_tool({name:"prepare_e_comet_feedback"})` once and follow the returned contract before feedback preparation.

1. For a host launch or bootstrap failure, use the independent [public fallback](https://github.com/e-comet/skills#troubleshooting). If Node can run the packaged file, collect exactly one `node mcp/src/doctor.mjs --json` result. Doctor covers only that Node execution plane.
2. For current local runtime facts, the agent calls `local_bridge_status`. `ok:true` means the response was produced, not that the product is healthy.
3. The agent calls `e_comet_diagnose` with the narrowest scope for installation evidence, runtime extension context, or an exact operation receipt. Installation probes are `storage_write`, `extension_install`, and, only for an observed Codex host, `hook_permissions` and `codex_mcp_auth`; the runtime probe is `extension_snapshot`. All require `safe_probes`. Repeating a passive read does not guarantee a more specific cause.
4. Read [DIAGNOSTICS.md](../../mcp/DIAGNOSTICS.md) for exact field and enum meanings. After the host is observed, read only [Codex](references/codex.md) or [Claude](references/claude.md).

## Extension rules

With a working local MCP and `extensionConnected:false`, read the status `code` first: a `BRIDGE_*` code is the
observed cause (Household cases). For `BRIDGE_NO_BROWSER` run installation `extension_install` (`safe_probes`), and
read DIAGNOSTICS.md for its coverage and inference boundaries. When metadata reads are complete (`readFailures:0`),
empty `profiles` in all checked browsers supports absence only in those checked profiles. Ask which browser
the user uses; if it is one of the checked browsers, installing from its extension store is a candidate action
(Chrome Web Store: https://chromewebstore.google.com/detail/e-comet/apeallgchpgibifmbgefkhifidihmodh).
Every listed profile `state:"disabled"` supports enabling it in the named browser only when metadata reads are
complete, unless `permissionsIncrease:true` (see Household cases). Installed and enabled in exactly one checked browser with complete reads, yet
`extensionConnected:false`, supports one action: open that browser and click the e-Comet icon, accepting the
permission under «Требуется действие» if shown; a retry is the user's decision.
`state:"enabled"` names a candidate browser, never the browser the user works in.
When more than one browser holds the extension, do not pick one: list what was found per browser and give each
action as a condition, "if you work in Chrome, enable it there; if in Yandex Browser, open it and click the e-Comet
icon there". Use `lastUsedDaysAgo` to order the candidates and mention when a profile's metadata files have not
changed for a long time; it is a hint from file modification times: it says when the browser's files last changed,
not that the browser is in use or open. When the extension is connected, `extension.version` from
`local_bridge_status` is the version of the
connected copy; a listed profile whose `version` equals it is the likely source, still a candidate: unchecked
browsers, unchecked profiles and unpacked copies can hold the same version. Say which found copy matches the
connected version and which does not, instead of suggesting the other browser. If `profileSource:"default_only"`, explain that only its
Default profile was checked. If any profile is `state:"unknown"`,
read failure, `unknown`, or `not_checked` remains, do not call the extension disabled or absent everywhere. Ask
which browser holds it and whether it is enabled, then suggest opening that browser and clicking the e-Comet
icon. Other browsers, including Firefox, are not covered by the probe; Firefox is unsupported
and a Chromium browser is required. These actions are candidates, not a proven disconnected-route cause. Never
prescribe a WB tab for an Ozon operation; use its typed Ozon route result instead.
For an Ozon route, if a found copy's `version` is below the typed Ozon minimum, suggest updating it to that
minimum only as a preliminary clue. The version from a connected extension's `hello_ack` is authoritative; the
found copy does not prove which browser is connected.

When the extension is connected and a signed tool fails at the `authorization` stage without a typed
`browserJobRejection.reason`, or the user asks to check installation or activation, run runtime
`extension_snapshot` first; with a typed reason, use the Household cases table and the `browserJobRejection.reason`
table in DIAGNOSTICS.md directly. `activationIdentity.state:"absent"` supports activating the extension with the
API key from the e-Comet account (https://app.e-comet.io/account) in that browser. If the snapshot returns
`unsupported`, the connected extension build does not offer it. Do not prescribe an extension update from this
alone and do not stop there. Run installation `extension_install` next for the install and enable facts above, and
say that activation cannot be checked on this route; `unsupported` is not evidence about activation or installation. For other typed refusals use the
`browserJobRejection.reason` table in DIAGNOSTICS.md. `errorDetails.code:"WB_NOT_AUTHENTICATED"` on a buyer product
unit supports signing in to wildberries.ru in the browser and profile that made the request; the snapshot is only
a hint about which browser that was.

Answer in this order: the plain-language problem; the proven cause or explicit uncertainty; the smallest action supported by that evidence; the observable result to expect. A request for troubleshooting, support, or help is not by itself a request for technical details. Perform available diagnostic calls yourself. Give the user only the action that requires their host or permission. Unknown may remain unknown with no next action or promised result. Keep JSON, codes, paths, protocol, JWT, broker, configuration, and hook details unless the user explicitly asks to see a particular technical detail.

Keep observations within their component, operation, and observation time. A storage-write probe tests only its own temporary file at that time. Even a concrete failure such as no free space does not prove that an earlier business report was unsaved or explain an uncertain report outcome. It can support preparing storage for future work, but an uncertain create or upload still follows its own receipt and must not be repeated.

Respect typed business results. WB, WB Seller, and Ozon have separate prerequisites. Status observations do not prove that the connection or extension is “working” for Ozon. Use the typed Ozon route result for recovery: when it reports an unready route without an update detail, the supported action is to check the extension in the same browser profile, refresh any authenticated Ozon Seller page under `/app`, and obtain new authorization before a user-chosen retry. Do not invent a company selector, a specific page, or a guarantee that another attempt will expose a more specific error. Never prescribe a WB tab for Ozon. Configuration `ready` does not prove writable storage; when the safe storage probe is the supported discriminator, the agent runs it rather than asking the user to invoke an MCP diagnostic. `unsupported`, `unknown`, and `not_checked` are different. Missing native hook context is unavailable evidence; missing Cowork cloud context is not device evidence.

`BROWSER_JOB_HANDOFF_REQUIRED`, or the Ozon message about the hook not providing authorization, is the symptom that the hooks did not provide the authorization: on an observed Codex host run `hook_permissions` before anything else, never repeat `browser_job`, and read the DIAGNOSTICS.md section Missing authorization handoff. A successful Codex `hook_permissions` result is a configuration snapshot for the checked installation context, not proof that a hook ran in this task. `ready` means all expected native handlers are enabled and trusted. `disabled` means at least one trusted handler is off. `review_required` means at least one handler is new or changed and awaits review. Name the affected safe handler roles. A `not_checked` result with `facts.context:"configuration_probe"` means the bounded inspector failed before a hook inventory was available; use its closed `failure.reason` and `failure.phase` as probe evidence, and do not describe hooks as missing, disabled, or untrusted. For observed ChatGPT Desktop with Codex, direct the user to Settings → Plugins → Personal → e-Comet MCP Tools → Hooks only when a snapshot observed a disabled or review-required handler: enable a disabled handler, or review a new or changed handler and trust it: these are the e-Comet plugin's own handlers, and Codex asks to trust them again after the plugin is installed or updated (the README step is Trust all). For observed Codex CLI, use `/hooks` for the corresponding observed action with the same explanation. Do not expose paths, commands, hashes, or raw inspector errors. Do not use a local Codex snapshot to explain Claude Code or Cowork.

Never repeat an uncertain create. Do not invent an Ozon report list, history, status, receipt API, or UI to resolve an unknown create; the outcome may remain unknown. A later create for the same item is a separate informed user decision under the current typed product contract, never a retry justified by missing output. Recovery applies only to work already proven complete through a supported operation.

Plain examples:

- Connection cause unknown: “The local connection could not be checked closely enough to name the cause. There is nothing useful you need to do yet.”
- Create outcome unknown: “It is unclear whether that report was created. I will not repeat it. There is no supported status check that can resolve this.”
- Host step unavailable: “I cannot verify from here whether that app step ran. This does not show that the integration is broken.”

Common mistakes: prescribing reinstall, login, opening WB, protection changes, or hook trust from absence alone; treating a stale version as the cause without a typed version failure; treating a registered tab as operational readiness; treating doctor output as host installation or enablement proof; offering a bug report for a user prerequisite from the Household cases table; repeating `browser_job` after `BROWSER_JOB_HANDOFF_REQUIRED`.

A missing exact packaged entrypoint is evidence that the package contents or configuration are incomplete and supports restoring package integrity through the host's supported installation path. Generic tool absence alone does not support reinstalling. A failed update lookup proves only that update availability is unknown; it does not create a useful user-run recheck step.
