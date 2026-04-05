// Billing tools — balance, pricing, and purchase
// Pricing is public (no auth). Balance and purchase require auth.

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

export function registerBillingTools(
  server: McpServer,
  api: UnphurlAPI
): void {
  // --- get_balance ---
  server.registerTool(
    "get_balance",
    {
      description: `Check your pipeline check credit balance. Shows credits remaining, total purchased, total used, and lifetime free lookups count.

Credits are consumed only when unknown domains run through the full analysis pipeline. Known domains (Tranco Top 100K) and cached domains (previously analysed by any Unphurl customer) are always free.

If credits_remaining is 0, you can still check known and cached domains for free. To check unknown domains, purchase more credits using the "purchase" tool.`,
      inputSchema: {},
    },
    async () => {
      if (!api.hasApiKey) return authError();

      try {
        const result = await api.balance();
        return successResult(result);
      } catch (err) {
        if (err instanceof ApiRequestError) return apiErrorToResult(err);
        return errorResult(err instanceof Error ? err.message : "Unknown error");
      }
    }
  );

  // --- get_pricing ---
  // No auth required
  server.registerTool(
    "get_pricing",
    {
      description: `Show available pipeline check credit packages and pricing. Returns all packages with credit counts and prices.

Packages (one-time purchase, no subscription):
- Starter: 100 credits for $9 ($0.09 each)
- Standard: 500 credits for $39 ($0.078 each)
- Pro: 2,000 credits for $99 ($0.0495 each)
- Scale: 10,000 credits for $399 ($0.0399 each)

Most URL lookups are free (known domains and cached domains). Credits are only consumed when an unknown domain runs through the full analysis pipeline. In typical use, 95-99% of URLs resolve free.

This tool does not require an API key.`,
      inputSchema: {},
    },
    async () => {
      try {
        const result = await api.pricing();
        return successResult(result);
      } catch (err) {
        if (err instanceof ApiRequestError) return apiErrorToResult(err);
        return errorResult(err instanceof Error ? err.message : "Unknown error");
      }
    }
  );

  // --- purchase ---
  server.registerTool(
    "purchase",
    {
      description: `Purchase pipeline check credits. Returns a Stripe Checkout URL that the user must open in a browser to complete payment.

The AI cannot complete the payment. Tell the user to open the URL in their browser, complete the Stripe checkout, and then confirm they've paid. Credits are added to the account automatically once Stripe confirms payment.

After purchase, use get_balance to verify credits have been added.`,
      inputSchema: {
        package: z
          .enum(["pkg_100", "pkg_500", "pkg_2000", "pkg_10000"])
          .describe(
            "Package to purchase: pkg_100 ($9, 100 credits), pkg_500 ($39, 500 credits), pkg_2000 ($99, 2000 credits), pkg_10000 ($399, 10000 credits)"
          ),
      },
    },
    async (args) => {
      if (!api.hasApiKey) return authError();

      try {
        const result = await api.purchase(args.package);
        return successResult({
          ...result,
          _note:
            "The user must open this URL in a browser to complete payment. Credits are added automatically after Stripe confirms payment.",
        });
      } catch (err) {
        if (err instanceof ApiRequestError) return apiErrorToResult(err);
        return errorResult(err instanceof Error ? err.message : "Unknown error");
      }
    }
  );
}
