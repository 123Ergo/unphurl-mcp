```
 _   _ _   _ ____  _   _ _   _ ____  _
| | | | \ | |  _ \| | | | | | |  _ \| |
| | | |  \| | |_) | |_| | | | | |_) | |
| |_| | |\  |  __/|  _  | |_| |  _ <| |___
 \___/|_| \_|_|   |_| |_|\___/|_| \_\_____|
```

**URL intelligence for AI tools. 13 MCP tools. 23 signals. 7 dimensions.**

Give your AI agent eyes for URLs. Unphurl analyses any URL across 7 dimensions (redirect behaviour, brand impersonation, domain age, SSL/TLS, parked detection, URL structure, DNS enrichment) and returns structured signals with a configurable 0-100 risk score. Signals, not verdicts. Your agent decides what to do with them.

Works with Claude Code, Claude Desktop, Claude Cowork, ChatGPT desktop, Cursor, Windsurf, and any MCP-compatible tool.

## What it costs

Every new account gets **3 free pipeline check credits**. Most lookups are free. Known domains (Tranco Top 100K) and previously analysed domains return cached results at no cost. You only pay when an unknown domain runs through the full pipeline.

| Package | Credits | Price | Per check |
|---------|---------|-------|-----------|
| Starter | 100 | $9 | $0.090 |
| Standard | 500 | $39 | $0.078 |
| Pro | 2,000 | $99 | $0.050 |
| Scale | 10,000 | $399 | $0.040 |

One-time purchases, no subscriptions. In typical use, 95-99% of URLs resolve free.

## Quick start

### 1. Add to your MCP configuration

Add to your `.mcp.json` (Claude Code, Claude Desktop, Claude Cowork, ChatGPT desktop, Cursor, Windsurf, or any MCP-compatible tool):

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

The AI can create one for you. Just ask: *"Sign up for Unphurl."* The `signup` tool works without an API key. After signup, add the key to your MCP configuration and restart.

### 3. Start checking URLs

Just talk to your AI:

> "Check https://suspicious-domain.xyz"

> "Batch check all URLs in this spreadsheet"

> "Create a scoring profile called 'lead-qual' that weights parked domains at 30 and no MX record at 20"

> "Check my credit balance"

No commands to memorize. No syntax to learn. Your AI handles the tool calls.

## What you get back

Every check returns signals across **7 dimensions**:

| Dimension | What it tells you |
|-----------|-------------------|
| **Redirect behaviour** | Full chain (up to 10 hops), shortener detection, stopped reasons |
| **Brand impersonation** | Levenshtein + homoglyph analysis against 150+ brands |
| **Domain intelligence** | Age, registrar, expiration, status codes, nameservers (via RDAP) |
| **SSL/TLS** | Real handshake validation from Cloudflare's edge |
| **Parked detection** | 4-layer check: registrar pages, for-sale, empty content, parking services |
| **URL structure** | Length, path depth, subdomain count, entropy, IP detection, encoded chars |
| **DNS enrichment** | MX record existence (can the domain receive email?) |

Every signal is business intelligence. Domain age tells you how established a company is. No MX record means they can't receive email. Expiring domains mean a business might be shutting down. Combined with your AI's ability to process in bulk and output to spreadsheets, it becomes a lightweight due diligence engine.

## 13 Tools

| Tool | What it does | Auth |
|------|-------------|------|
| `signup` | Create a new account, get an API key | No |
| `resend_verification` | Resend verification email (3/hour limit) | Yes |
| `check_url` | Check a single URL across all 7 dimensions | Yes |
| `check_urls` | Batch check up to 500 URLs (handles async polling automatically) | Yes |
| `list_profiles` | List your custom scoring profiles | Yes |
| `create_profile` | Create or update a scoring profile with custom weights | Yes |
| `delete_profile` | Delete a scoring profile | Yes |
| `show_defaults` | Show all 23 scoring signals with default weights | No |
| `get_balance` | Check your pipeline check credit balance | Yes |
| `get_stats` | View usage statistics and score threshold counts | Yes |
| `get_pricing` | Show available credit packages and pricing | No |
| `purchase` | Purchase credits (returns Stripe Checkout URL) | Yes |
| `check_history` | View recent URL check history | Yes |

## Power moves

### Batch check + filter

> "Check these 500 URLs. Give me two lists: the clean ones (score under 25) and the flagged ones (score 50 or higher). Export both as CSV."

Your AI gets the batch results, filters by score, and outputs the lists. No code, no scripting.

### Custom scoring profiles

Different jobs need different weights. A security bot cares about brand impersonation. A cold email tool cares about parked domains and missing MX records.

> "Create a profile called 'cold-email' that weights parked at 30, no_mx_record at 20, and domain_age_7 at 25. Then batch check my lead list using that profile."

### Combine with other tools

Unphurl inside an AI chat combines with everything else your agent has access to:

- **Spreadsheets**: Read a CRM export, batch-check every URL, write results back with risk scores
- **Web scraping**: Scrape a competitor's partner page, check every link for health
- **Documents**: Generate a branded PDF audit report from the results
- **Scheduled tasks**: "Check my critical URLs every Monday morning"

## How billing works

- A positive credit balance is required for all checks, even free lookups.
- **Known domains** (google.com, amazon.com, etc.): free, instant.
- **Cached domains** (analysed recently by anyone): free, instant.
- **Unknown domains** (first-time analysis): 1 credit each.
- Batch checks deduct credits upfront for unknowns. If you don't have enough, you get a summary showing exactly how many credits you need.
- Failed pipeline checks are automatically refunded.

## Companion skill

The `check-url-safety` skill teaches your AI to proactively check URLs before following or recommending them, without being asked.

**Claude Cowork or Claude Desktop:** Just ask: *"Install the Unphurl URL safety skill."*

**Claude Code, Cursor, or other dev tools:**

```bash
# Global (all projects)
cp node_modules/@unphurl/mcp-server/skills/check-url-safety.md ~/.claude/skills/

# Or for a specific project
cp node_modules/@unphurl/mcp-server/skills/check-url-safety.md .claude/skills/
```

## Build a business on it

Unphurl costs you $0.04-$0.09 per check. A website link audit takes 15 minutes and uses 50-100 credits. Charge $150-$500 per audit.

Service ideas: link health audits, lead list verification, SEO backlink audits, newsletter link monitoring, vendor vetting reports, brand protection monitoring, influencer vetting.

## Also available as

- **CLI**: `npx unphurl` ([npm](https://www.npmjs.com/package/unphurl))
- **Hosted MCP** for Claude Cowork (no local install): [mcp.unphurl.com](https://mcp.unphurl.com)
- **REST API**: [api.unphurl.com](https://api.unphurl.com)
- **Website**: [unphurl.com](https://unphurl.com)
- **Visual guides**: [unphurl.com/getting-started-guides](https://unphurl.com/getting-started-guides)

## License

MIT
