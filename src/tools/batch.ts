// check_urls tool — batch URL check with automatic polling
// Submits batch, polls for async results, merges everything into one response.
// The agent sees one tool call, one result. All polling is invisible.

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LinkCheckAPI } from "../api.js";
import { ApiRequestError } from "../api.js";
import type { BatchResultItem } from "../types.js";
import {
  successResult,
  authError,
  apiErrorToResult,
  errorResult,
  sleep,
} from "./helpers.js";

const POLL_INTERVAL_MS = 2000;
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function registerBatchTool(server: McpServer, api: LinkCheckAPI): void {
  server.registerTool(
    "check_urls",
    {
      description: `Check multiple URLs in a single batch. Returns results for all URLs, handling async processing automatically.

Each URL is analysed across eight dimensions: redirect behaviour, brand impersonation, domain age and registrar, domain expiration and status, SSL/TLS validity, parked domain detection, URL structural analysis, and DNS enrichment. Known and cached URLs return results immediately. Unknown URLs are queued for pipeline processing. This tool automatically polls for results until all URLs are complete or the 5-minute timeout is reached. You don't need to manage polling or job tracking.

If the timeout is reached before all results are complete, returns whatever is available with a clear message indicating which URLs are still processing. The user can check results later via check_history.

Maximum 200 URLs per call. For larger datasets, call this tool multiple times with chunks of up to 200 URLs.

Billing: Same as check_url. Known and cached domains are free. Only unknown domains running through the full pipeline cost 1 credit each. The summary shows pipeline_checks_charged (the actual number of credits consumed). If you don't have enough credits for the unknowns in the batch, the entire batch is rejected with a 402 error telling you exactly how many credits are needed.

Duplicate URLs in the list are automatically deduplicated (processed once, charged once). Invalid URLs get individual error status without rejecting the batch.

Use the "profile" parameter to score all results with custom weights.`,
      inputSchema: {
        urls: z
          .array(z.string())
          .describe("List of URLs to check (maximum 200 per call)"),
        profile: z
          .string()
          .optional()
          .describe(
            "Name of a custom scoring profile to use for all URLs (optional)"
          ),
      },
    },
    async ({ urls, profile }, extra) => {
      if (!api.hasApiKey) return authError();

      try {
        // Step 1: Submit the batch
        const batchResponse = await api.batchCheck(urls, profile);

        // Step 2: If no job_id, everything resolved from cache/Tranco — return immediately
        if (!batchResponse.job_id) {
          return successResult(batchResponse);
        }

        // Step 3: Poll for async results
        const startTime = Date.now();
        const progressToken = extra?._meta?.progressToken;
        let jobResponse = await api.pollJob(batchResponse.job_id);

        while (jobResponse.status !== "completed") {
          // Check timeout before sleeping
          if (Date.now() - startTime > TIMEOUT_MS) {
            break;
          }

          await sleep(POLL_INTERVAL_MS);
          jobResponse = await api.pollJob(batchResponse.job_id);

          // Send progress notification if the client supports it
          if (progressToken !== undefined) {
            const completed = jobResponse.summary.completed ?? 0;
            const total = jobResponse.summary.total ?? urls.length;
            try {
              await extra.sendNotification({
                method: "notifications/progress" as const,
                params: {
                  progressToken,
                  progress: completed,
                  total,
                },
              });
            } catch {
              // Client may not support progress notifications — that's fine, skip silently
            }
          }
        }

        // Step 4: Merge batch response (known/cached) with job response (pipeline results)
        // Build a lookup from the job response for URLs that were processed async
        const jobResultMap = new Map<string, BatchResultItem>();
        for (const item of jobResponse.results) {
          jobResultMap.set(item.url, item);
        }

        // Replace pending items in the original batch response with completed results
        const mergedResults = batchResponse.results.map((item) => {
          if (item.status === "pending" && jobResultMap.has(item.url)) {
            return jobResultMap.get(item.url)!;
          }
          return item;
        });

        // Step 5: Build unified summary
        const complete = mergedResults.filter(
          (r) => r.status === "complete" || r.status === "completed"
        ).length;
        const pending = mergedResults.filter(
          (r) => r.status === "pending"
        ).length;
        const failed = mergedResults.filter(
          (r) => r.status === "error" || r.status === "failed"
        ).length;

        const result: Record<string, unknown> = {
          results: mergedResults,
          summary: {
            total: mergedResults.length,
            complete,
            pending,
            failed,
            pipeline_checks_charged:
              jobResponse.summary.pipeline_checks_charged ?? 0,
          },
        };

        // Flag partial results if timeout was reached
        if (pending > 0) {
          result.message = `Timeout reached after 5 minutes. ${pending} URL(s) still processing. Check results later via check_history.`;
        }

        return successResult(result);
      } catch (err) {
        if (err instanceof ApiRequestError) return apiErrorToResult(err);
        return errorResult(err instanceof Error ? err.message : "Unknown error");
      }
    }
  );
}
