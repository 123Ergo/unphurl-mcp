// Unphurl MCP Server — domain intelligence for AI tools
// Wraps the Unphurl API as 11 MCP tools for Claude Code, Cursor, Windsurf, etc.
//
// Configuration:
//   UNPHURL_API_KEY  — your API key (optional for signup/pricing/defaults)
//   UNPHURL_API_URL  — API base URL (defaults to production)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { UnphurlAPI } from "./api.js";
import { registerSignupTools } from "./tools/signup.js";
import { registerCheckTool } from "./tools/check.js";
import { registerBatchTool } from "./tools/batch.js";
import { registerProfileTools } from "./tools/profiles.js";
import { registerBillingTools } from "./tools/billing.js";
import { registerHistoryTool } from "./tools/history.js";
import { registerStatsTool } from "./tools/stats.js";

const DEFAULT_API_URL = "https://api.unphurl.com";

// Backward compatibility: accept LINKCHECK_* env vars for users migrating from LinkCheck
const apiKey = process.env.UNPHURL_API_KEY || process.env.LINKCHECK_API_KEY || undefined;
const apiUrl = process.env.UNPHURL_API_URL || process.env.LINKCHECK_API_URL || DEFAULT_API_URL;

const api = new UnphurlAPI(apiUrl, apiKey);

const server = new McpServer({
  name: "unphurl",
  version: "0.1.0",
});

// Register all 13 tools across 7 modules
registerSignupTools(server, api); // signup, resend_verification
registerCheckTool(server, api);
registerBatchTool(server, api);
registerProfileTools(server, api); // list_profiles, create_profile, delete_profile, show_defaults
registerBillingTools(server, api); // get_balance, get_pricing, purchase
registerHistoryTool(server, api);
registerStatsTool(server, api);

// Start the server on stdio
const transport = new StdioServerTransport();
await server.connect(transport);
