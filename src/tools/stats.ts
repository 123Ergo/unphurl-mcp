// Stats tool — account usage statistics
// Requires auth. Returns usage breakdown, score threshold counts, and credit balance.

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { UnphurlAPI } from "../api.js";
import { ApiRequestError } from "../api.js";
import {
  successResult,
  authError,
  apiErrorToResult,
  errorResult,
} from "./helpers.js";

export function registerStatsTool(
  server: McpServer,
  api: UnphurlAPI
): void {
  server.registerTool(
    "get_stats",
    {
      description: `View your account usage statistics. Shows total URLs submitted, breakdown by gate (Tranco lookups, cache lookups, pipeline checks), free rate percentage, score threshold counts, and credit balance.

Use this to understand your usage patterns: how many of your checks resolved free (known or cached domains) vs paid pipeline checks, and how many URLs scored above key thresholds.

This is useful for:
- Checking if your scoring profile is flagging the right proportion of URLs
- Understanding your cost efficiency (higher free rate = more value per credit)
- Reporting usage metrics`,
      inputSchema: {},
    },
    async () => {
      if (!api.hasApiKey) return authError();

      try {
        const result = await api.stats();
        return successResult(result);
      } catch (err) {
        if (err instanceof ApiRequestError) return apiErrorToResult(err);
        return errorResult(err instanceof Error ? err.message : "Unknown error");
      }
    }
  );
}
