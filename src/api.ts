// HTTP client for the Unphurl API
// Uses Node's built-in https/http modules. Same pattern as the CLI, separate package.

import * as https from "node:https";
import * as http from "node:http";
import { URL } from "node:url";
import type {
  CheckResponse,
  BalanceResponse,
  BatchResponse,
  JobResponse,
  ProfileListResponse,
  Profile,
  ApiError,
  SignupResponse,
  HistoryResponse,
  PricingResponse,
  PurchaseResponse,
  StatsResponse,
} from "./types.js";

interface HttpResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}

function request(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: string
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === "https:";
    if (!isHttps && !["localhost", "127.0.0.1"].includes(parsed.hostname)) {
      reject(new Error("HTTPS is required for non-local API URLs. Your API key would be sent in plaintext."));
      return;
    }
    const lib = isHttps ? https : http;

    const opts: https.RequestOptions = {
      method,
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      headers: {
        ...headers,
        ...(body
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(body).toString(),
            }
          : {}),
      },
    };

    const req = lib.request(opts, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode || 0,
          headers: res.headers,
          body: Buffer.concat(chunks).toString("utf-8"),
        });
      });
    });

    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

// Paths that don't require an API key
const PUBLIC_PATHS = ["/v1/signup", "/v1/pricing", "/v1/verify/resend"];

export class UnphurlAPI {
  private baseUrl: string;
  private apiKey: string | undefined;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
  }

  // Whether this client has an API key configured
  get hasApiKey(): boolean {
    return !!this.apiKey;
  }

  private authHeaders(): Record<string, string> {
    if (!this.apiKey) return {};
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  private async doRequest<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
    const headers = isPublic ? {} : this.authHeaders();
    const bodyStr = body ? JSON.stringify(body) : undefined;
    const res = await request(method, url, headers, bodyStr);

    if (res.status >= 400) {
      let err: ApiError;
      try {
        err = JSON.parse(res.body);
      } catch {
        err = { error: "unknown", message: res.body || `HTTP ${res.status}` };
      }
      throw new ApiRequestError(res.status, err);
    }

    // 204 No Content (e.g. profile delete)
    if (res.status === 204) {
      return {} as T;
    }

    return JSON.parse(res.body) as T;
  }

  async check(urlToCheck: string, profile?: string): Promise<CheckResponse> {
    let path = `/v1/check?url=${encodeURIComponent(urlToCheck)}`;
    if (profile) path += `&profile=${encodeURIComponent(profile)}`;
    return this.doRequest<CheckResponse>("GET", path);
  }

  async batchCheck(urls: string[], profile?: string): Promise<BatchResponse> {
    const body: Record<string, unknown> = { urls };
    if (profile) body.profile = profile;
    return this.doRequest<BatchResponse>("POST", "/v1/check/batch", body);
  }

  async pollJob(jobId: string): Promise<JobResponse> {
    return this.doRequest<JobResponse>(
      "GET",
      `/v1/jobs/${encodeURIComponent(jobId)}`
    );
  }

  async balance(): Promise<BalanceResponse> {
    return this.doRequest<BalanceResponse>("GET", "/v1/balance");
  }

  async listProfiles(): Promise<ProfileListResponse> {
    return this.doRequest<ProfileListResponse>("GET", "/v1/profiles");
  }

  async createProfile(
    name: string,
    weights: Record<string, number>
  ): Promise<Profile> {
    return this.doRequest<Profile>("POST", "/v1/profiles", { name, weights });
  }

  async deleteProfile(name: string): Promise<void> {
    await this.doRequest<unknown>(
      "DELETE",
      `/v1/profiles/${encodeURIComponent(name)}`
    );
  }

  async signup(
    email: string,
    firstName: string,
    company?: string
  ): Promise<SignupResponse> {
    const body: Record<string, string> = { email, first_name: firstName };
    if (company) body.company = company;
    return this.doRequest<SignupResponse>("POST", "/v1/signup", body);
  }

  async history(page?: number, limit?: number): Promise<HistoryResponse> {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));
    const qs = params.toString();
    return this.doRequest<HistoryResponse>(
      "GET",
      `/v1/history${qs ? "?" + qs : ""}`
    );
  }

  async pricing(): Promise<PricingResponse> {
    return this.doRequest<PricingResponse>("GET", "/v1/pricing");
  }

  async purchase(packageId: string): Promise<PurchaseResponse> {
    return this.doRequest<PurchaseResponse>("POST", "/v1/purchase", {
      package: packageId,
    });
  }

  async stats(): Promise<StatsResponse> {
    return this.doRequest<StatsResponse>("GET", "/v1/account/stats");
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    return this.doRequest<{ message: string }>("POST", "/v1/verify/resend", { email });
  }
}

export class ApiRequestError extends Error {
  status: number;
  apiError: ApiError;

  constructor(status: number, apiError: ApiError) {
    super(apiError.message || `HTTP ${status}`);
    this.status = status;
    this.apiError = apiError;
  }
}
