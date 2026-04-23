// Hardcoded default scoring weights and signal descriptions
// Used by show_defaults tool — no API call needed

export const DEFAULT_SIGNALS = [
  {
    key: "brand_impersonation",
    default_weight: 40,
    description: "Domain name resembles a major brand (Levenshtein distance + homoglyph analysis against 150+ brands)",
  },
  {
    key: "domain_age_3",
    default_weight: 35,
    description: "Domain registered within the last 3 days",
  },
  {
    key: "domain_age_7",
    default_weight: 25,
    description: "Domain registered within the last 7 days",
  },
  {
    key: "domain_age_30",
    default_weight: 15,
    description: "Domain registered within the last 30 days",
  },
  {
    key: "domain_age_90",
    default_weight: 5,
    description: "Domain registered within the last 90 days",
  },
  {
    key: "ssl_invalid",
    default_weight: 10,
    description: "SSL/TLS certificate is missing, expired, or invalid",
  },
  {
    key: "http_only",
    default_weight: 5,
    description: "Site has no SSL/TLS at all (HTTP only)",
  },
  {
    key: "redirects_3",
    default_weight: 10,
    description: "URL has 3-4 redirects in the chain",
  },
  {
    key: "redirects_5",
    default_weight: 25,
    description: "URL has 5 or more redirects in the chain",
  },
  {
    key: "chain_incomplete",
    default_weight: 15,
    description: "Redirect chain could not be fully followed (timeout, blocked, or loop)",
  },
  {
    key: "parked",
    default_weight: 10,
    description: "Domain is parked (registrar placeholder, 'for sale' page, or parking service)",
  },
  {
    key: "compound",
    default_weight: 10,
    description: "3 or more signals detected together with at least one high-severity anchor (domain ≤30 days, 5+ redirects, invalid certificate, parked, or incomplete chain). The score breakdown names which signals contributed.",
  },
  {
    key: "brand_impersonation_floor",
    default_weight: 80,
    description: "Minimum score applied when brand impersonation is confirmed alongside a meaningful secondary signal. Structural signals like url_long or subdomain_excessive alone do not qualify.",
  },
  {
    key: "url_long",
    default_weight: 3,
    description: "URL is longer than 200 characters",
  },
  {
    key: "path_deep",
    default_weight: 3,
    description: "URL path has more than 4 segments",
  },
  {
    key: "subdomain_deep",
    default_weight: 3,
    description: "Domain has 2 subdomains",
  },
  {
    key: "subdomain_excessive",
    default_weight: 5,
    description: "Domain has 3 or more subdomains",
  },
  {
    key: "domain_entropy_high",
    default_weight: 5,
    description: "Domain name has high character entropy (random-looking)",
  },
  {
    key: "url_contains_ip",
    default_weight: 10,
    description: "URL uses an IP address instead of a domain name",
  },
  {
    key: "encoded_hostname",
    default_weight: 5,
    description: "Hostname contains percent-encoded characters",
  },
  {
    key: "tld_redirect_change",
    default_weight: 5,
    description: "TLD changed on redirect to a suspicious final TLD (e.g. .com→.xyz fires; .com→.ca does not)",
  },
  {
    key: "js_fragment_redirect",
    default_weight: 25,
    description: "HTML page on object storage (S3, GCS, Azure Blob) reads the URL fragment client-side and redirects the visitor to the decoded destination — a common phishing delivery technique",
  },
  {
    key: "expiring_soon",
    default_weight: 10,
    description: "Domain registration expires within 30 days",
  },
  {
    key: "domain_status_bad",
    default_weight: 15,
    description: "Domain has a bad status code (pendingDelete, serverHold, etc.)",
  },
  {
    key: "no_mx_record",
    default_weight: 5,
    description: "Domain has no MX record (cannot receive email)",
  },
] as const;

export const DEFAULTS_NOTE =
  "Profiles override specific weights. Signals not in a profile use these defaults. 25 configurable signals plus suspicious_tld (+3 points) which is internal only and not configurable.";
