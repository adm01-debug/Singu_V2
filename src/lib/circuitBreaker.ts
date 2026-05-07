/**
 * Circuit Breaker — Prevents cascading failures when external services are down.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is down, requests fail fast without calling the service
 * - HALF_OPEN: After cooldown, allows one probe request to test recovery
 *
 * Usage:
 *   const breaker = new CircuitBreaker('bitrix24', { failureThreshold: 3, resetTimeoutMs: 30000 });
 *   const result = await breaker.call(() => fetch('https://api.bitrix24.com/...'));
 */

import { logger } from "@/lib/logger";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit (default: 5) */
  failureThreshold?: number;
  /** Time in ms to wait before trying a probe request (default: 30000) */
  resetTimeoutMs?: number;
  /** Optional callback when state changes */
  onStateChange?: (name: string, from: CircuitState, to: CircuitState) => void;
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly onStateChange?: (name: string, from: CircuitState, to: CircuitState) => void;

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30_000;
    this.onStateChange = options.onStateChange;
  }

  private transition(to: CircuitState) {
    if (this.state !== to) {
      const from = this.state;
      this.state = to;
      logger.info(`[CircuitBreaker:${this.name}] ${from} → ${to}`);
      this.onStateChange?.(this.name, from, to);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Execute a function through the circuit breaker.
   * Throws CircuitOpenError if the circuit is open.
   */
  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.resetTimeoutMs) {
        this.transition("HALF_OPEN");
      } else {
        throw new CircuitOpenError(
          this.name,
          this.resetTimeoutMs - elapsed
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      // Garantir logs consistentes mesmo para erros internos
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.warn(`[CircuitBreaker:${this.name}] Call failed: ${msg}`);
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === "HALF_OPEN") {
      this.transition("CLOSED");
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.transition("OPEN");
    }
  }

  /** Manually reset the breaker to CLOSED state */
  reset() {
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.transition("CLOSED");
  }
}

export class CircuitOpenError extends Error {
  readonly retryAfterMs: number;
  readonly serviceName: string;

  constructor(serviceName: string, retryAfterMs: number) {
    super(
      `Circuit breaker [${serviceName}] is OPEN. Retry after ${Math.ceil(retryAfterMs / 1000)}s.`
    );
    this.name = "CircuitOpenError";
    this.serviceName = serviceName;
    this.retryAfterMs = retryAfterMs;
  }
}

// ─── Singleton registry for shared circuit breakers ───

const registry = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(
  name: string,
  options?: CircuitBreakerOptions
): CircuitBreaker {
  let breaker = registry.get(name);
  if (!breaker) {
    breaker = new CircuitBreaker(name, options);
    registry.set(name, breaker);
  }
  return breaker;
}
