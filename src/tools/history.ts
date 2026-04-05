// check_history tool — view recent URL check history
// Paginated, 90-day retention

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { UnphurlAPI } from "../api.js";
import { ApiRequestError } from "../api.js";
import {
  successResult,
  authError,
  apiErrorToResult,
  errorResult,
} from "./helpers.js";

export function registerHistoryTool(
  server: McpServer,
  api: UnphurlAPI
): void {
  server.registerTool(
    "check_history",
    {
      description: `View recent URL check history. Shows what URLs have been checked, their scores, phishing status, and whether each check was free or used a pipeline credit.

Results are paginated. Use page and limit parameters to navigate. Default is 20 results per page, maximum 100.

History is retained for 90 days. Account-level stats (total credits, balance) never expire.`,
      inputSchema: {
        page: z.number().optional().describe("Page number (default 1)"),
        limit: z
          .number()
          .optional()
          .describe("Results per page, max 100 (default 20)"),
      },
    },
    async ({ page, limit }) => {
      if (!api.hasApiKey) return authError();

      try {
        const result = await api.history(page, limit);
        return successResult(result);
      } catch (err) {
        if (err instanceof ApiRequestError) return apiErrorToResult(err);
        return errorResult(err instanceof Error ? err.message : "Unknown error");
      }
    }
  );
}
