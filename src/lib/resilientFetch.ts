import { logger } from "@/lib/logger";

interface RetryOptions {
  /** Max number of retries (default: 2) */
  maxRetries?: number;
  /** Base delay in ms (default: 1000). Doubles each retry. */
  baseDelayMs?: number;
  /** Max delay cap in ms (default: 10000) */
  maxDelayMs?: number;
  /** HTTP status codes that trigger a retry (default: [408, 429, 500, 502, 503, 504]) */
  retryStatuses?: number[];
  /** AbortSignal to cancel the request */
  signal?: AbortSignal;
}

const DEFAULT_RETRY_STATUSES = [408, 429, 500, 502, 503, 504];

/**
 * Fetch with exponential backoff retry.
 * Only retries on network errors or specific HTTP status codes.
 */
export async function resilientFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RetryOptions,
): Promise<Response> {
  const maxRetries = options?.maxRetries ?? 2;
  const baseDelay = options?.baseDelayMs ?? 1000;
  const maxDelay = options?.maxDelayMs ?? 10_000;
  const retryStatuses = options?.retryStatuses ?? DEFAULT_RETRY_STATUSES;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(input, {
        ...init,
        signal: options?.signal ?? init?.signal,
      });

      // Don't retry on success or client errors (except retryable ones)
      if (response.ok || !retryStatuses.includes(response.status)) {
        return response;
      }

      // Retryable HTTP error
      if (attempt < maxRetries) {
        const retryAfter = response.headers.get("Retry-After");
        const delay = retryAfter
          ? Math.min(parseInt(retryAfter, 10) * 1000, maxDelay)
          : Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

        logger.warn(
          `[resilientFetch] ${response.status} on attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${delay}ms`
        );
        await sleep(delay);
        continue;
      }

      return response; // Last attempt, return whatever we got
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on abort
      if (lastError.name === "AbortError") throw lastError;

      if (attempt < maxRetries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        logger.warn(
          `[resilientFetch] Network error on attempt ${attempt + 1}/${maxRetries + 1}: ${lastError.message}, retrying in ${delay}ms`
        );
        await sleep(delay);
      }
    }
  }

  throw lastError ?? new Error("resilientFetch: all retries exhausted");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
