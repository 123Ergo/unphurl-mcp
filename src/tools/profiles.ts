// Profile tools — list, create, delete, and show defaults
// Profiles are named weight sets that change how LinkCheck scores URLs

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LinkCheckAPI } from "../api.js";
import { ApiRequestError } from "../api.js";
import { DEFAULT_SIGNALS, DEFAULTS_NOTE } from "../defaults.js";
import {
  successResult,
  authError,
  apiErrorToResult,
  errorResult,
} from "./helpers.js";

export function registerProfileTools(
  server: McpServer,
  api: LinkCheckAPI
): void {
  // --- list_profiles ---
  server.registerTool(
    "list_profiles",
    {
      description: `List all custom scoring profiles on this account. Returns profile names and their custom weight overrides.

Profiles are named weight sets that change how LinkCheck scores URLs. Different use cases need different scoring. A cold email agent cares about dead domains. A security bot cares about phishing. Profiles let one account serve multiple use cases.

Profiles only override specific weights. Any signal not specified in a profile uses the default weight. Use show_defaults to see all 22 signals and their default weights.`,
      inputSchema: {},
    },
    async () => {
      if (!api.hasApiKey) return authError();

      try {
        const result = await api.listProfiles();
        return successResult(result);
      } catch (err) {
        if (err instanceof ApiRequestError) return apiErrorToResult(err);
        return errorResult(err instanceof Error ? err.message : "Unknown error");
      }
    }
  );

  // --- create_profile ---
  server.registerTool(
    "create_profile",
    {
      description: `Create or update a custom scoring profile. Profiles are sparse overrides: only specify the weights you want to change. Everything else keeps its default value.

If a profile with this name already exists, it is updated with the new weights (full replacement, not merge).

Weights are points, not percentages. Each weight is the number of points that signal adds to the score when it fires. They don't need to total 100. A profile with weights totalling 90 is conservative (max possible score is 90). A profile with weights totalling 130 is aggressive (multiple signals quickly push to the cap of 100). The threshold the agent sets for action matters more than the weight totals.

Use show_defaults to see all 22 signals with their default weights and descriptions before creating a profile. Use check_url or check_urls with the "profile" parameter to score results with this profile.

Maximum 10 profiles per account. Profile name "default" is reserved.

Common profiles:
- Cold email: weight parked (30), chain_incomplete (25), ssl_invalid (15) higher. Lower brand_impersonation (10).
- Security bot: keep brand_impersonation high (40), increase domain_age_7 (30), redirects_5 (25).
- Lead gen: weight parked (35), http_only (20), chain_incomplete (20) for dead business detection.
- SEO audit: weight redirects_5 (30), chain_incomplete (30), parked (25) for link quality.

See the LinkCheck API documentation for all 19 use case weight examples.`,
      inputSchema: {
        name: z
          .string()
          .describe(
            "Profile name (lowercase alphanumeric and hyphens only, e.g. 'cold-email', 'security-bot')"
          ),
        weights: z
          .record(z.string(), z.number())
          .describe(
            "Custom weights for scoring signals. Only include signals you want to override. Available signals: brand_impersonation (default 40), domain_age_7 (25), domain_age_30 (15), domain_age_90 (5), ssl_invalid (10), http_only (5), redirects_3 (10), redirects_5 (25), chain_incomplete (15), parked (10), compound (10), phishing_floor (80), url_long (3), path_deep (3), subdomain_excessive (5), domain_entropy_high (5), url_contains_ip (10), encoded_hostname (5), tld_redirect_change (5), expiring_soon (10), domain_status_bad (15), no_mx_record (5)."
          ),
      },
    },
    async ({ name, weights }) => {
      if (!api.hasApiKey) return authError();

      try {
        const result = await api.createProfile(name, weights);
        return successResult(result);
      } catch (err) {
        if (err instanceof ApiRequestError) return apiErrorToResult(err);
        return errorResult(err instanceof Error ? err.message : "Unknown error");
      }
    }
  );

  // --- delete_profile ---
  server.registerTool(
    "delete_profile",
    {
      description: `Delete a custom scoring profile. This is permanent. Any future check requests using this profile name will fall back to default weights.

Use list_profiles to see your current profiles before deleting.`,
      inputSchema: {
        name: z.string().describe("Name of the profile to delete"),
      },
    },
    async ({ name }) => {
      if (!api.hasApiKey) return authError();

      try {
        await api.deleteProfile(name);
        return successResult({
          message: `Profile '${name}' deleted successfully.`,
        });
      } catch (err) {
        if (err instanceof ApiRequestError) return apiErrorToResult(err);
        return errorResult(err instanceof Error ? err.message : "Unknown error");
      }
    }
  );

  // --- show_defaults ---
  // Fully hardcoded, no API call, no auth required
  server.registerTool(
    "show_defaults",
    {
      description: `Show all 22 scoring signals with their default weights and descriptions. This is the baseline scoring that applies when no custom profile is specified.

Use this to understand what each signal means and how much it contributes to the score before creating custom profiles. Profiles are sparse overrides on top of these defaults.

This tool does not require an API key. The defaults are hardcoded and always available.`,
      inputSchema: {},
    },
    async () => {
      return successResult({
        signals: DEFAULT_SIGNALS,
        note: DEFAULTS_NOTE,
      });
    }
  );
}
