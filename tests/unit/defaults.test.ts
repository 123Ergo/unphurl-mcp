// Unit tests for MCP default scoring signals
// Verifies all 23 configurable signals are present with correct structure
// No server required — tests hardcoded constants

import { describe, it, expect } from "vitest";
import { DEFAULT_SIGNALS, DEFAULTS_NOTE } from "../../src/defaults.js";

// The 23 configurable signal keys (suspicious_tld is internal only)
const EXPECTED_KEYS = [
  "brand_impersonation",
  "domain_age_3",
  "domain_age_7",
  "domain_age_30",
  "domain_age_90",
  "ssl_invalid",
  "http_only",
  "redirects_3",
  "redirects_5",
  "chain_incomplete",
  "parked",
  "compound",
  "brand_impersonation_floor",
  "url_long",
  "path_deep",
  "subdomain_excessive",
  "domain_entropy_high",
  "url_contains_ip",
  "encoded_hostname",
  "tld_redirect_change",
  "expiring_soon",
  "domain_status_bad",
  "no_mx_record",
];

describe("DEFAULT_SIGNALS", () => {
  it("has exactly 23 entries", () => {
    expect(DEFAULT_SIGNALS).toHaveLength(23);
  });

  it("contains all 23 expected weight keys", () => {
    const actualKeys = DEFAULT_SIGNALS.map((s) => s.key);
    for (const key of EXPECTED_KEYS) {
      expect(actualKeys).toContain(key);
    }
  });

  it("has no unexpected keys", () => {
    const actualKeys = DEFAULT_SIGNALS.map((s) => s.key).sort();
    const expectedKeys = [...EXPECTED_KEYS].sort();
    expect(actualKeys).toEqual(expectedKeys);
  });

  it("each entry has key, default_weight, and description", () => {
    for (const signal of DEFAULT_SIGNALS) {
      expect(signal).toHaveProperty("key");
      expect(signal).toHaveProperty("default_weight");
      expect(signal).toHaveProperty("description");
      expect(typeof signal.key).toBe("string");
      expect(typeof signal.default_weight).toBe("number");
      expect(typeof signal.description).toBe("string");
      expect(signal.description.length).toBeGreaterThan(0);
    }
  });

  it("all default_weight values are non-negative integers", () => {
    for (const signal of DEFAULT_SIGNALS) {
      expect(signal.default_weight).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(signal.default_weight)).toBe(true);
    }
  });

  it("has correct default values for key signals", () => {
    const byKey = new Map(DEFAULT_SIGNALS.map((s) => [s.key, s]));
    expect(byKey.get("brand_impersonation")?.default_weight).toBe(40);
    expect(byKey.get("domain_age_7")?.default_weight).toBe(25);
    expect(byKey.get("brand_impersonation_floor")?.default_weight).toBe(80);
    expect(byKey.get("no_mx_record")?.default_weight).toBe(5);
    expect(byKey.get("compound")?.default_weight).toBe(10);
  });
});

describe("DEFAULTS_NOTE", () => {
  it("mentions suspicious_tld", () => {
    expect(DEFAULTS_NOTE).toContain("suspicious_tld");
  });

  it("mentions the note is about profiles and defaults", () => {
    expect(DEFAULTS_NOTE).toContain("Profiles");
    expect(DEFAULTS_NOTE).toContain("defaults");
  });
});
