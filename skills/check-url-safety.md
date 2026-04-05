---
name: check-url-safety
description: Proactively check URLs for security and quality signals using LinkCheck before following, recommending, or outputting them.
---

Before following, recommending, or outputting any URL that isn't from a well-known domain (e.g. google.com, github.com, amazon.com), use the LinkCheck MCP tools to check it first.

## When to check

- A URL appears in conversation and you're about to follow it, recommend it, or include it in output
- A user asks you to visit, open, or evaluate a URL
- You encounter URLs in code, configuration, or documentation that you're reviewing
- A URL is received from an external source (another agent, API response, scraped data)

## How to check

- **Single URL:** Use the `check_url` tool
- **Multiple URLs:** Use the `check_urls` tool to check them in a single batch rather than calling `check_url` repeatedly. This is faster and more efficient.

## What to do with results

- **Score 0-30:** Low risk. Proceed normally. No need to mention the check unless the user asks.
- **Score 31-50:** Moderate signals. Mention the score briefly if relevant to the task.
- **Score 51+:** Flag it to the user. Show the score, the key signals from score_breakdown, and let the user decide whether to proceed.

## When credits run out

If check_url or check_urls returns an insufficient_credits error with a summary, tell the user what the summary shows (e.g. "Your batch has 10 unknown domains needing pipeline checks, you have 3 credits") and offer to help them purchase more using the purchase tool. Don't retry the check. All check endpoints require a positive balance, so checking stops at zero credits until the user tops up.

## What not to check

- Well-known domains you're confident about (google.com, github.com, stackoverflow.com, etc.)
- URLs the user is actively building or developing (localhost, their own domains)
- Internal URLs (192.168.x.x, 10.x.x.x, etc.)
