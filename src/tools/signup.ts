// signup tool — create a new Unphurl account
// No API key required. Returns the key (shown once).

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { UnphurlAPI } from "../api.js";
import { ApiRequestError } from "../api.js";
import { successResult, apiErrorToResult, errorResult } from "./helpers.js";

export function registerSignupTools(server: McpServer, api: UnphurlAPI): void {
  registerSignupTool(server, api);
  registerResendVerificationTool(server, api);
}

function registerSignupTool(server: McpServer, api: UnphurlAPI): void {
  server.registerTool(
    "signup",
    {
      description: `Create a new Unphurl account. Returns an API key (shown once, store it securely).

After signup, the user must check their email and click the verification link. The API key won't work for URL checks until the email is verified. Verification link expires after 24 hours. If the link expires, use the "resend_verification" tool to request a new one.

The account starts with 20 free pipeline check credits so the user can test with real URLs. Known domain lookups (google.com, github.com, etc.) and cached domain lookups are always free. To check more unknown domains through the full analysis pipeline, the user can purchase credits via the "purchase" tool.

Once the user has their API key, they need to add it to their MCP server configuration as UNPHURL_API_KEY.

This tool does not require an API key.`,
      inputSchema: {
        email: z.string().email().describe("Email address for the account"),
        first_name: z.string().describe("First name (used for personalized emails)"),
        company: z.string().optional().describe("Company name (optional)"),
      },
    },
    async ({ email, first_name, company }) => {
      try {
        const result = await api.signup(email, first_name, company);
        return successResult({
          ...result,
          _security_note: "IMPORTANT: This API key is shown once and cannot be retrieved later. Tell the user to copy it immediately and store it securely. Do not include the full key in any summary, log, or conversation export.",
        });
      } catch (err) {
        if (err instanceof ApiRequestError) return apiErrorToResult(err);
        return errorResult(err instanceof Error ? err.message : "Unknown error");
      }
    }
  );
}

function registerResendVerificationTool(server: McpServer, api: UnphurlAPI): void {
  server.registerTool(
    "resend_verification",
    {
      description: `Resend the email verification link for an existing Unphurl account.

Use this when a user signed up but their verification link expired (links are valid for 24 hours) and they need a new one. The user's API key won't work until their email is verified.

For security, the response is always the same regardless of whether the email exists, is already verified, or was rate limited. This prevents account enumeration.

Rate limited to 3 requests per email per hour.

This tool does not require an API key.`,
      inputSchema: {
        email: z.string().email().describe("Email address of the account that needs verification"),
      },
    },
    async ({ email }) => {
      try {
        const result = await api.resendVerification(email);
        return successResult(result);
      } catch (err) {
        if (err instanceof ApiRequestError) return apiErrorToResult(err);
        return errorResult(err instanceof Error ? err.message : "Unknown error");
      }
    }
  );
}
