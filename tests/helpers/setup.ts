/**
 * Test Helpers — Account creation and D1 manipulation for MCP integration tests
 *
 * Follows the same pattern as the API project's tests/helpers/setup.ts.
 * Creates test accounts via the local dev server, seeds credits via wrangler d1.
 *
 * Prerequisites:
 *   - wrangler dev running at localhost:8787 (from the API project)
 *   - wrangler CLI available for D1 operations
 */

import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:8787";

// Path to the API project root (for wrangler d1 commands)
const __dirname = dirname(fileURLToPath(import.meta.url));
const API_PROJECT_ROOT = process.env.API_PROJECT_ROOT || resolve(__dirname, "../../../Linkcheck API");

export interface TestAccount {
  apiKey: string;
  email: string;
}

/**
 * Create a test account via the signup API.
 * Uses signup_source: "slack" to auto-verify the email.
 */
export async function createTestAccount(suffix?: string): Promise<TestAccount> {
  const email = `mcp-test-${Date.now()}-${suffix || "default"}@unphurl-test.com`;
  const res = await fetch(`${BASE_URL}/v1/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      first_name: "MCP Test",
      signup_source: "slack",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Signup failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { api_key: string; email: string };
  return { apiKey: data.api_key, email: data.email };
}

/**
 * Add credits to a test account via direct D1 manipulation.
 */
export function addCredits(email: string, credits: number): void {
  executeD1(`UPDATE customers SET credits = ${credits} WHERE email = '${escapeSql(email)}'`);
}

/**
 * Clean up test account data from D1.
 */
export function cleanupTestAccount(email: string): void {
  const escaped = escapeSql(email);
  executeD1(`DELETE FROM scoring_profiles WHERE account_id IN (SELECT id FROM customers WHERE email = '${escaped}')`);
  executeD1(`DELETE FROM check_log WHERE api_key_hash IN (SELECT api_key_hash FROM customers WHERE email = '${escaped}')`);
  executeD1(`DELETE FROM customers WHERE email = '${escaped}'`);
}

/**
 * Execute SQL against the local D1 database via wrangler CLI.
 */
function executeD1(sql: string, retries = 3): void {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      execSync(
        `npx wrangler d1 execute linkcheck-db --local --command "${sql.replace(/"/g, '\\"')}"`,
        { encoding: "utf-8", stdio: "pipe", cwd: API_PROJECT_ROOT },
      );
      return;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes("SQLITE_BUSY") && attempt < retries) {
        execSync("sleep 1");
        continue;
      }
      console.error(`D1 execute failed for SQL: ${sql}`);
      throw err;
    }
  }
}

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}
