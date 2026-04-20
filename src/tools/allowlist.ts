// Allowlist tools — list, add, and remove trusted domains
// Allowlisted domains suppress compound and brand_impersonation_floor scoring.
// Full pipeline still runs — all signals remain visible for monitoring.

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

export function registerAllowlistTools(
  server: McpServer,
  api: UnphurlAPI
): void {
  // --- list_allowlist ---
  server.registerTool(
    "list_allowlist",
    {
      description: `List all domains on this account's trusted allowlist.

Allowlisted domains suppress the compound signal and brand impersonation floor in scoring. The full pipeline still runs — all signals remain visible for monitoring. Use this to see which domains are currently trusted.

Returns the list of domains, current count, and the 1,000-domain limit.`,
      inputSchema: {},
    },
    async () => {
      if (!api.hasApiKey) return authError();

      try {
        const result = await api.listAllowlist();
        return successResult(result);
      } catch (err) {
        if (err instanceof ApiRequestError) return apiErrorToResult(err);
        return errorResult(err instanceof Error ? err.message : "Unknown error");
      }
    }
  );

  // --- add_to_allowlist ---
  server.registerTool(
    "add_to_allowlist",
    {
      description: `Add one or more domains to this account's trusted allowlist.

Allowlisted domains suppress the compound signal and brand impersonation floor in scoring. The full pipeline still runs — all signals remain visible so you can monitor trusted domains for SSL expiry, parking, or other changes.

Submit the registrable domain only (e.g. partnerco.com). Subdomains and full URLs are rejected. Adding partnerco.com covers sub.partnerco.com and all other subdomains automatically.

Maximum 1,000 domains per account. Maximum 100 domains per request. Duplicates are silently skipped.`,
      inputSchema: {
        domains: z
          .array(z.string().min(1))
          .min(1)
          .max(100)
          .describe(
            "Registrable domains to add (e.g. ['partnerco.com', 'trustedvendor.io']). Subdomains and full URLs are rejected."
          ),
      },
    },
    async ({ domains }) => {
      if (!api.hasApiKey) return authError();

      try {
        const result = await api.addToAllowlist(domains);
        return successResult(result);
      } catch (err) {
        if (err instanceof ApiRequestError) return apiErrorToResult(err);
        return errorResult(err instanceof Error ? err.message : "Unknown error");
      }
    }
  );

  // --- remove_from_allowlist ---
  server.registerTool(
    "remove_from_allowlist",
    {
      description: `Remove one or more domains from this account's trusted allowlist.

Once removed, those domains resume normal scoring on the next check. Use list_allowlist to see what is currently on the list before removing.`,
      inputSchema: {
        domains: z
          .array(z.string().min(1))
          .min(1)
          .max(100)
          .describe(
            "Registrable domains to remove (e.g. ['partnerco.com'])"
          ),
      },
    },
    async ({ domains }) => {
      if (!api.hasApiKey) return authError();

      try {
        const result = await api.removeFromAllowlist(domains);
        return successResult(result);
      } catch (err) {
        if (err instanceof ApiRequestError) return apiErrorToResult(err);
        return errorResult(err instanceof Error ? err.message : "Unknown error");
      }
    }
  );
}
