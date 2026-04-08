// TypeScript interfaces for Unphurl API responses
// Adapted from the CLI's types.ts — same API, separate package

export interface ScoreBreakdownItem {
  signal: string;
  points: number;
  description?: string;
  detail?: string;
}

export interface RedirectSignals {
  chain: string[];
  count: number;
  initial_shortener: string | null;
  stopped_reason: string | null;
}

export interface DomainSignals {
  age_days: number | null;
  registrar: string | null;
  expires_days: number | null;
  status_codes: string[] | null;
  nameservers: string[] | null;
  has_mx_record: boolean | null;
  is_parked: boolean;
  is_known: boolean;
  content_type: string | null;
}

export interface UrlAnalysisSignals {
  url_length: number | null;
  path_depth: number | null;
  subdomain_count: number | null;
  domain_entropy: number | null;
  contains_ip: boolean | null;
  encoded_hostname: boolean | null;
  tld_changed_on_redirect: boolean | null;
}

export interface SslSignals {
  valid: boolean;
}

export interface PhishingSignals {
  is_phishing: boolean;
  brand_impersonation: string | null;
}

export interface Signals {
  redirects: RedirectSignals;
  domain: DomainSignals;
  ssl: SslSignals;
  phishing: PhishingSignals;
  url_analysis?: UrlAnalysisSignals;
}

export interface Meta {
  checked_at: string;
  latency_ms: number;
  cached: boolean;
  cache_age_hours: number | null;
  pipeline_check_charged: boolean;
  cache_ttl_remaining_hours: number | null;
}

export interface CheckResponse {
  url: string;
  final_url: string;
  domain: string;
  score: number;
  profile?: string;
  score_breakdown: ScoreBreakdownItem[];
  signals: Signals;
  meta: Meta;
}

export interface BalanceResponse {
  credits_remaining: number;
  total_purchased: number;
  total_used: number;
  free_lookups: number;
}

export interface BatchResultItem {
  url: string;
  status: "complete" | "completed" | "pending" | "error" | "failed";
  result?: CheckResponse;
  error?: string;
}

export interface BatchSummary {
  total: number;
  unique?: number;
  duplicates_removed?: number;
  complete?: number;
  completed?: number;
  pending?: number;
  errors?: number;
  failed?: number;
  pipeline_checks_queued?: number;
  pipeline_checks_charged?: number;
}

export interface BatchResponse {
  results: BatchResultItem[];
  summary: BatchSummary;
  job_id?: string;
  poll_url?: string;
}

export interface JobResponse {
  job_id: string;
  status: "processing" | "completed";
  results: BatchResultItem[];
  summary: BatchSummary;
  created_at: string;
}

export interface ProfileWeight {
  [key: string]: number;
}

export interface Profile {
  name: string;
  weights: ProfileWeight;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileListResponse {
  profiles: Profile[];
}

export interface ApiError {
  error: string;
  message: string;
  credits_remaining?: number;
  purchase_url?: string;
  summary?: Record<string, unknown>;
}

export interface SignupResponse {
  api_key: string;
  email: string;
  first_name: string;
  email_verified: boolean;
  credits: number;
  message: string;
}

export interface HistoryCheck {
  domain: string;
  score: number;
  is_phishing: boolean;
  brand_impersonation: string | null;
  redirect_count: number;
  checked_at: string;
}

export interface HistoryResponse {
  checks: HistoryCheck[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface PricingPackage {
  id: string;
  credits: number;
  price: string;
  description: string;
}

export interface PricingResponse {
  model: string;
  description: string;
  packages: PricingPackage[];
  minimum_entry: string;
  [key: string]: unknown;
}

export interface PurchaseResponse {
  checkout_url: string;
  package: {
    id: string;
    credits: number;
    price: string;
  };
}

export interface StatsResponse {
  usage: {
    total_urls_submitted: number;
    tranco_lookups: number;
    cache_lookups: number;
    pipeline_checks_run: number;
    free_rate_pct: number;
  };
  scoring: {
    checks_above_50: number;
    checks_above_75: number;
  };
  account: {
    credits_remaining: number;
    total_credits_purchased: number;
    last_active_at: string;
  };
}
