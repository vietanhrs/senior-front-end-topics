/**
 * A teaching-grade model of the browser's "does this cross-origin request need
 * a CORS preflight?" decision. Simplified but captures the rules that trip up
 * most engineers (notably: application/json is NOT safelisted).
 */
export interface RequestConfig {
  method: string;
  contentType: string;
  /** Author-set request header names beyond the safelist, e.g. Authorization, X-Token. */
  customHeaders: string[];
  credentials: boolean;
}

const SIMPLE_METHODS = new Set(['GET', 'HEAD', 'POST']);
const SAFELISTED_CONTENT_TYPES = new Set([
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
]);
// Header names that don't, by themselves, force a preflight.
const SAFELISTED_HEADERS = new Set([
  'accept',
  'accept-language',
  'content-language',
  'content-type',
  'range',
]);

export interface PreflightVerdict {
  needsPreflight: boolean;
  reasons: string[];
}

export function evaluatePreflight(cfg: RequestConfig): PreflightVerdict {
  const reasons: string[] = [];

  if (!SIMPLE_METHODS.has(cfg.method.toUpperCase())) {
    reasons.push(`Method ${cfg.method} is not in {GET, HEAD, POST}.`);
  }
  if (!SAFELISTED_CONTENT_TYPES.has(cfg.contentType)) {
    reasons.push(`Content-Type "${cfg.contentType}" is not on the safelist.`);
  }
  const offendingHeaders = cfg.customHeaders
    .map((h) => h.toLowerCase())
    .filter((h) => !SAFELISTED_HEADERS.has(h));
  if (offendingHeaders.length > 0) {
    reasons.push(`Non-safelisted custom headers: ${offendingHeaders.join(', ')}.`);
  }

  return { needsPreflight: reasons.length > 0, reasons };
}
