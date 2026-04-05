// check_url tool — single URL check
// Returns risk score, signal breakdown, and metadata

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LinkCheckAPI } from "../api.js";
import { ApiRequestError } from "../api.js";
import {
  successResult,
  authError,
  apiErrorToResult,
  errorResult,
} from "./helpers.js";

export function registerCheckTool(server: McpServer, api: LinkCheckAPI): void {
  server.registerTool(
    "check_url",
    {
      description: `Check a single URL for security and data quality signals. Returns a risk score (0-100), detailed signal breakdown, and metadata.

LinkCheck analyses URLs across eight dimensions: redirect behaviour, brand impersonation, domain age and registrar, domain expiration and status, SSL/TLS validity, parked domain detection, URL structural analysis (length, path depth, subdomain count, entropy), and DNS enrichment (MX records, nameservers). The score is calculated from these signals using either default weights or a custom scoring profile.

Higher scores mean more suspicious. The score is a signal, not a verdict. You decide the threshold based on the use case.

Billing: Most lookups are free. Known domains (Tranco Top 100K like google.com, github.com) return instantly with score 0 at no cost. Previously analysed domains return cached signals at no cost. Only unknown domains that run through the full analysis pipeline cost 1 pipeline check credit. The response's meta.pipeline_check_charged field tells you whether this check consumed a credit.

Use the "profile" parameter to score results with custom weights. For example, a "cold-email" profile might weight parked domains heavily while ignoring brand impersonation. Use list_profiles to see available profiles, or show_defaults to see all signal weights.

If the account has zero credits and the URL requires a full pipeline check, returns a 402 error with a link to purchase more credits.`,
      inputSchema: {
        url: z.string().describe("The URL to check"),
        profile: z
          .string()
          .optional()
          .describe(
            "Name of a custom scoring profile to use (optional). If omitted, default weights are used."
          ),
      },
    },
    async ({ url, profile }) => {
      if (!api.hasApiKey) return authError();

      try {
        const result = await api.check(url, profile);
        return successResult(result);
      } catch (err) {
        if (err instanceof ApiRequestError) return apiErrorToResult(err);
        return errorResult(err instanceof Error ? err.message : "Unknown error");
      }
    }
  );
}
