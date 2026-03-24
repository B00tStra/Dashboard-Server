# AI Desk Security Council Report

- Generated: `2026-03-22T16:36:11+00:00`
- Scan root: `/home/fabio/.openclaw/workspace`
- Files reviewed: **33**
- Findings: **4**
- Highest severity: **high**
- Telegram alert: **no**

## Severity counts

- critical: 0
- high: 1
- medium: 3
- low: 0
- info: 0

## Findings

### [HIGH] destructive-rm

- File: `stock_news_report.py:1472`
- Why it matters: Flags destructive recursive deletion commands for manual review.
- Recommendation: Review the deletion path carefully and add stronger path guards or dry-run protection.

```text
shutil.rmtree(resolved_path)
```

### [MEDIUM] bind-all-interfaces

- File: `scripts/preview_stock_news.sh:24`
- Why it matters: Flags services binding to 0.0.0.0 for exposure review.
- Recommendation: Confirm the service must be externally reachable; otherwise bind to localhost or put it behind a trusted proxy.

```text
--lan                  Bind to 0.0.0.0 so phones/tablets on the same LAN can open it
```

### [MEDIUM] bind-all-interfaces

- File: `scripts/preview_stock_news.sh:44`
- Why it matters: Flags services binding to 0.0.0.0 for exposure review.
- Recommendation: Confirm the service must be externally reachable; otherwise bind to localhost or put it behind a trusted proxy.

```text
HOST="0.0.0.0"
```

### [MEDIUM] bind-all-interfaces

- File: `scripts/preview_stock_news.sh:111`
- Why it matters: Flags services binding to 0.0.0.0 for exposure review.
- Recommendation: Confirm the service must be externally reachable; otherwise bind to localhost or put it behind a trusted proxy.

```text
if [[ "$HOST" == "0.0.0.0" ]]; then
```

## Deferred

- No LLM reasoning pass yet.
- No suppression list yet.
- No historical diffing yet.
