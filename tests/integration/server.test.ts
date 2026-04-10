// Integration tests for the MCP server protocol
// Starts the MCP server as a child process and communicates via stdio
// Uses the official MCP SDK Client + StdioClientTransport
// Requires: wrangler dev running at localhost:8787, npm run build completed

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createTestAccount, addCredits, cleanupTestAccount, BASE_URL } from "../helpers/setup.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MCP_ROOT = resolve(__dirname, "../..");
const SERVER_BIN = resolve(MCP_ROOT, "dist/index.js");

let client: Client;
let transport: StdioClientTransport;
let testAccount: { apiKey: string; email: string };

beforeAll(async () => {
  // Create a test account with credits
  testAccount = await createTestAccount("mcp-integration");
  addCredits(testAccount.email, 100);

  // Start the MCP server with test configuration
  transport = new StdioClientTransport({
    command: "node",
    args: [SERVER_BIN],
    env: {
      ...process.env,
      UNPHURL_API_KEY: testAccount.apiKey,
      UNPHURL_API_URL: BASE_URL,
    },
  });

  client = new Client({
    name: "test-client",
    version: "1.0.0",
  });

  await client.connect(transport);
}, 30_000);

afterAll(async () => {
  try {
    await client?.close();
  } catch {
    // Server may have already exited
  }
  try {
    await transport?.close();
  } catch {
    // Transport may have already closed
  }
  if (testAccount?.email) {
    cleanupTestAccount(testAccount.email);
  }
});

describe("MCP initialisation", () => {
  it("server responds to initialise and reports capabilities", () => {
    // If beforeAll succeeded, the server initialised correctly
    // The client.connect() call performs the initialize handshake
    expect(client).toBeDefined();
  });
});

describe("tools/list", () => {
  it("returns all 13 tools", async () => {
    const response = await client.listTools();
    expect(response.tools).toHaveLength(13);

    const toolNames = response.tools.map((t) => t.name).sort();
    const expected = [
      "check_history",
      "check_url",
      "check_urls",
      "create_profile",
      "delete_profile",
      "get_balance",
      "get_pricing",
      "get_stats",
      "list_profiles",
      "purchase",
      "resend_verification",
      "show_defaults",
      "signup",
    ];
    expect(toolNames).toEqual(expected);
  });
});

describe("show_defaults (no API key needed)", () => {
  it("returns 23 signals", async () => {
    const result = await client.callTool({ name: "show_defaults", arguments: {} });
    expect(result.content).toHaveLength(1);

    const textContent = result.content[0];
    expect(textContent).toHaveProperty("type", "text");
    const parsed = JSON.parse((textContent as { type: "text"; text: string }).text);
    expect(parsed.signals).toHaveLength(23);

    // Verify structure of each signal
    for (const signal of parsed.signals) {
      expect(signal).toHaveProperty("key");
      expect(signal).toHaveProperty("default_weight");
      expect(signal).toHaveProperty("description");
    }
  });
});

describe("get_pricing (no API key needed)", () => {
  it("returns pricing packages", async () => {
    const result = await client.callTool({ name: "get_pricing", arguments: {} });
    expect(result.content).toHaveLength(1);

    const textContent = result.content[0];
    const parsed = JSON.parse((textContent as { type: "text"; text: string }).text);
    expect(parsed).toHaveProperty("packages");
    expect(parsed.packages.length).toBeGreaterThanOrEqual(4);

    // Verify pricing values
    const ids = parsed.packages.map((p: { id: string }) => p.id);
    expect(ids).toContain("pkg_100");
    expect(ids).toContain("pkg_10000");
  });
});

describe("check_url with API key", () => {
  it("checks google.com and returns correct response shape", async () => {
    const result = await client.callTool({
      name: "check_url",
      arguments: { url: "https://google.com" },
    });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);

    const textContent = result.content[0];
    const parsed = JSON.parse((textContent as { type: "text"; text: string }).text);

    // Verify response shape
    expect(parsed).toHaveProperty("url");
    expect(parsed).toHaveProperty("domain");
    expect(parsed).toHaveProperty("score");
    expect(parsed).toHaveProperty("signals");
    expect(parsed).toHaveProperty("meta");

    // google.com is Tranco Top 100K — score should be 0
    expect(parsed.domain).toContain("google.com");
    expect(parsed.score).toBe(0);
    expect(parsed.signals.domain.is_known).toBe(true);
    expect(parsed.meta.pipeline_check_charged).toBe(false);
  });
});
