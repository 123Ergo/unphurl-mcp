# @unphurl/mcp-server

Domain intelligence for AI tools. Unphurl analyses URLs across seven dimensions (redirect behaviour, brand impersonation, domain intelligence via RDAP, SSL/TLS validity, parked domain detection, URL structural analysis, and DNS enrichment) and returns structured signals with a configurable risk score. 22 scoring weights, all customizable per use case. One URL in, structured intelligence out. Your agent decides what to do with it.

## What it costs

Every new account gets **3 free pipeline check credits** to test with real URLs. Most lookups are free. Known domains (Tranco Top 100K) and previously analysed domains return cached results at no cost. You only pay when an unknown domain runs through the full analysis pipeline. Packages start at $9 for 100 pipeline checks (one-time purchase, no subscription). In typical use, 95-99% of URLs resolve free.

## Quick start

### 1. Add to your MCP configuration

Add to your `.mcp.json` (Claude Code, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "unphurl": {
      "command": "npx",
      "args": ["-y", "@unphurl/mcp-server"],
      "env": {
        "UNPHURL_API_KEY": "uph_your_key_here"
      }
    }
  }
}
```

### 2. No account yet?

The AI can create one for you. Just ask it to sign up for Unphurl. The `signup` tool works without an API key. After signup, add the key to your MCP configuration and restart.

### 3. Optional: custom API URL

For local development or staging, set `UNPHURL_API_URL` in the env block. Defaults to `https://api.unphurl.com`.

## Tools

| Tool | Description | Auth |
|------|-------------|------|
| `signup` | Create a new account, get an API key | No |
| `check_url` | Check a single URL for security/quality signals | Yes |
| `check_urls` | Batch check up to 200 URLs (handles async polling automatically) | Yes |
| `list_profiles` | List custom scoring profiles | Yes |
| `create_profile` | Create or update a scoring profile | Yes |
| `delete_profile` | Delete a scoring profile | Yes |
| `show_defaults` | Show all 22 scoring signals with default weights | No |
| `get_balance` | Check pipeline check credit balance | Yes |
| `get_pricing` | Show available credit packages and pricing | No |
| `purchase` | Purchase credits (returns Stripe Checkout URL) | Yes |
| `check_history` | View recent URL check history | Yes |

## Filtering batch results

After a batch check with `check_urls`, ask your AI to filter the results:

> "Check these 500 URLs. Give me two lists: the clean ones (score under 25) and the flagged ones (score 50 or higher). Export both as CSV."

The agent gets the batch results, filters by score, and outputs the lists you need. No code, no jq, no scripting. This is one of the advantages of the MCP path: your AI is the filter.

## Companion skill

The `check-url-safety` skill teaches your AI to proactively check URLs before following or recommending them.

To install, copy `skills/check-url-safety.md` to your skills directory:

```bash
# Claude Code
cp node_modules/@unphurl/mcp-server/skills/check-url-safety.md ~/.claude/skills/

# Or for a specific project
cp node_modules/@unphurl/mcp-server/skills/check-url-safety.md .claude/skills/
```

The skill teaches the agent to:
- Check unfamiliar URLs before recommending them
- Use batch checking for multiple URLs (more efficient)
- Handle zero-credit situations gracefully
- Skip well-known domains that don't need checking

## Links

- [API Documentation](https://unphurl.com/docs)
- [CLI Tool](https://www.npmjs.com/package/unphurl)
- [Website](https://unphurl.com)

## License

MIT
