// signup tool — create a new LinkCheck account
// No API key required. Returns the key (shown once).

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LinkCheckAPI } from "../api.js";
import { ApiRequestError } from "../api.js";
import { successResult, apiErrorToResult, errorResult } from "./helpers.js";

export function registerSignupTool(server: McpServer, api: LinkCheckAPI): void {
  server.registerTool(
    "signup",
    {
      description: `Create a new LinkCheck account. Returns an API key (shown once, store it securely).

After signup, the user must check their email and click the verification link. The API key won't work for URL checks until the email is verified. Verification link expires after 24 hours.

The account starts with zero pipeline check credits. Known domain lookups (google.com, github.com, etc.) and cached domain lookups are always free. To check unknown domains through the full analysis pipeline, the user needs to purchase credits via the "purchase" tool.

Once the user has their API key, they need to add it to their MCP server configuration as LINKCHECK_API_KEY.

This tool does not require an API key.`,
      inputSchema: {
        email: z.string().describe("Email address for the account"),
        first_name: z.string().describe("First name (used for personalized emails)"),
        company: z.string().optional().describe("Company name (optional)"),
      },
    },
    async ({ email, first_name, company }) => {
      try {
        const result = await api.signup(email, first_name, company);
        return successResult(result);
      } catch (err) {
        if (err instanceof ApiRequestError) return apiErrorToResult(err);
        return errorResult(err instanceof Error ? err.message : "Unknown error");
      }
    }
  );
}
