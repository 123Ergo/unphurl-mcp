// Unit tests for MCP tool registration and descriptions
// Verifies all 16 tools are registered with correct metadata
// No server required — uses a mock McpServer to capture registrations

import { describe, it, expect, beforeAll } from "vitest";
import { vi } from "vitest";
import { registerSignupTools } from "../../src/tools/signup.js";
import { registerCheckTool } from "../../src/tools/check.js";
import { registerBatchTool } from "../../src/tools/batch.js";
import { registerProfileTools } from "../../src/tools/profiles.js";
import { registerBillingTools } from "../../src/tools/billing.js";
import { registerHistoryTool } from "../../src/tools/history.js";
import { registerStatsTool } from "../../src/tools/stats.js";
import { registerAllowlistTools } from "../../src/tools/allowlist.js";

// Capture tool registrations via a mock server
interface ToolRegistration {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: Function;
}

const registeredTools: Map<string, ToolRegistration> = new Map();

const mockServer = {
  registerTool: vi.fn((name: string, options: { description: string; inputSchema: Record<string, unknown> }, handler: Function) => {
    registeredTools.set(name, { name, description: options.description, inputSchema: options.inputSchema, handler });
  }),
};

// Minimal API stub (no calls are made during registration)
const mockApi = {
  hasApiKey: true,
  check: vi.fn(),
  batchCheck: vi.fn(),
  pollJob: vi.fn(),
  balance: vi.fn(),
  listProfiles: vi.fn(),
  createProfile: vi.fn(),
  deleteProfile: vi.fn(),
  signup: vi.fn(),
  history: vi.fn(),
  pricing: vi.fn(),
  purchase: vi.fn(),
  stats: vi.fn(),
  resendVerification: vi.fn(),
  listAllowlist: vi.fn(),
  addToAllowlist: vi.fn(),
  removeFromAllowlist: vi.fn(),
} as any;

beforeAll(() => {
  registerSignupTools(mockServer as any, mockApi);
  registerCheckTool(mockServer as any, mockApi);
  registerBatchTool(mockServer as any, mockApi);
  registerProfileTools(mockServer as any, mockApi);
  registerBillingTools(mockServer as any, mockApi);
  registerHistoryTool(mockServer as any, mockApi);
  registerStatsTool(mockServer as any, mockApi);
  registerAllowlistTools(mockServer as any, mockApi);
});

describe("tool registration", () => {
  it("registers exactly 16 tools", () => {
    expect(registeredTools.size).toBe(16);
  });

  const EXPECTED_TOOLS = [
    "signup",
    "resend_verification",
    "check_url",
    "check_urls",
    "list_profiles",
    "create_profile",
    "delete_profile",
    "show_defaults",
    "get_balance",
    "get_pricing",
    "purchase",
    "check_history",
    "get_stats",
    "list_allowlist",
    "add_to_allowlist",
    "remove_from_allowlist",
  ];

  it("registers all 16 expected tool names", () => {
    for (const name of EXPECTED_TOOLS) {
      expect(registeredTools.has(name)).toBe(true);
    }
  });

  it("has no unexpected tool names", () => {
    const actualNames = [...registeredTools.keys()].sort();
    const expectedNames = [...EXPECTED_TOOLS].sort();
    expect(actualNames).toEqual(expectedNames);
  });

  it("all registration functions exist and are callable", () => {
    expect(typeof registerSignupTools).toBe("function");
    expect(typeof registerCheckTool).toBe("function");
    expect(typeof registerBatchTool).toBe("function");
    expect(typeof registerProfileTools).toBe("function");
    expect(typeof registerBillingTools).toBe("function");
    expect(typeof registerHistoryTool).toBe("function");
    expect(typeof registerStatsTool).toBe("function");
    expect(typeof registerAllowlistTools).toBe("function");
  });
});

describe("tool descriptions", () => {
  it("check_url mentions 'seven dimensions'", () => {
    const tool = registeredTools.get("check_url")!;
    expect(tool.description).toContain("seven dimensions");
  });

  it("check_urls mentions '500' max batch size and '5-minute timeout'", () => {
    const tool = registeredTools.get("check_urls")!;
    expect(tool.description).toContain("500");
    expect(tool.description).toMatch(/5.minute/i);
  });

  it("create_profile mentions '23' signals and lists all weight keys in input schema", () => {
    const tool = registeredTools.get("create_profile")!;
    expect(tool.description).toContain("23");
    // All 23 weight keys are listed in the weights parameter description, not the tool description
    // The mock captures the raw zod schema; extract the description from the weights field
    const weightsSchema = tool.inputSchema.weights;
    const weightsDesc = weightsSchema?.description ?? "";
    const keySignals = ["brand_impersonation", "domain_age_7", "ssl_invalid", "parked", "no_mx_record", "compound", "brand_impersonation_floor"];
    for (const signal of keySignals) {
      expect(weightsDesc).toContain(signal);
    }
  });

  it("show_defaults mentions '23 scoring signals'", () => {
    const tool = registeredTools.get("show_defaults")!;
    expect(tool.description).toContain("23");
    expect(tool.description.toLowerCase()).toContain("scoring signal");
  });

  it("signup mentions 'UNPHURL_API_KEY' and 'resend_verification'", () => {
    const tool = registeredTools.get("signup")!;
    expect(tool.description).toContain("UNPHURL_API_KEY");
    expect(tool.description).toContain("resend_verification");
  });

  it("resend_verification mentions rate limiting and no API key", () => {
    const tool = registeredTools.get("resend_verification")!;
    expect(tool.description.toLowerCase()).toContain("rate limit");
    expect(tool.description.toLowerCase()).toContain("does not require an api key");
  });

  it("purchase mentions Stripe and browser", () => {
    const tool = registeredTools.get("purchase")!;
    expect(tool.description).toContain("Stripe");
    expect(tool.description.toLowerCase()).toContain("browser");
  });

  it("get_balance mentions 'credits'", () => {
    const tool = registeredTools.get("get_balance")!;
    expect(tool.description.toLowerCase()).toContain("credit");
  });

  it("get_stats mentions 'usage' and 'statistics'", () => {
    const tool = registeredTools.get("get_stats")!;
    expect(tool.description.toLowerCase()).toContain("usage");
    expect(tool.description.toLowerCase()).toContain("statistic");
  });
});

describe("show_defaults handler", () => {
  it("returns hardcoded data with 23 signals (no API call)", () => {
    // show_defaults is hardcoded; no API call happens
    // Call the handler directly and verify the result
    const tool = registeredTools.get("show_defaults")!;
    const resultPromise = tool.handler({}, {});

    return resultPromise.then((result: any) => {
      // MCP result is { content: [{ type: "text", text: "..." }] }
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty("signals");
      expect(parsed.signals).toHaveLength(23);
      expect(parsed).toHaveProperty("note");

      // Verify each signal has key, default_weight, description
      for (const signal of parsed.signals) {
        expect(signal).toHaveProperty("key");
        expect(signal).toHaveProperty("default_weight");
        expect(signal).toHaveProperty("description");
      }
    });
  });
});
