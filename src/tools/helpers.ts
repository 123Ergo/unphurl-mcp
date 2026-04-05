// Shared utilities for MCP tool handlers
// Provides consistent success/error formatting across all tools

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ApiRequestError } from "../api.js";

// Wrap any data as a successful MCP tool result
export function successResult(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

// Return a plain error message as an MCP tool error
export function errorResult(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

// Standard error for tools that require an API key but none is configured
export function authError(): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          error: "auth_required",
          message:
            "API key is missing. Set UNPHURL_API_KEY in your MCP server configuration, or use the signup tool to create an account first.",
        }),
      },
    ],
    isError: true,
  };
}

// Convert an API error into an MCP tool error
// Special-cases 402 (insufficient credits) to prompt the agent toward the purchase tool
export function apiErrorToResult(err: ApiRequestError): CallToolResult {
  const body = err.apiError;

  if (err.status === 402) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ...body,
              _hint:
                "Use the purchase tool to buy more credits, or get_pricing to see available packages.",
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  return {
    content: [{ type: "text", text: JSON.stringify(body, null, 2) }],
    isError: true,
  };
}

// Promise-based sleep for polling loops
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
