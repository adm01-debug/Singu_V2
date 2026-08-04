import { useCallback } from "react";
import { toast } from "sonner";
import { CircuitOpenError } from "@/lib/circuitBreaker";

/**
 * Hook that wraps async operations with circuit breaker error handling.
 * Shows a user-friendly toast when the circuit is open instead of generic errors.
 */
export function useCircuitBreakerHandler() {
  const handleError = useCallback((error: unknown, fallbackMessage?: string) => {
    if (error instanceof CircuitOpenError) {
      const seconds = Math.ceil(error.retryAfterMs / 1000);
      toast.warning("Serviço temporariamente indisponível", {
        description: `O sistema detectou instabilidade na conexão. Tentando reconectar em ${seconds}s...`,
        duration: Math.min(error.retryAfterMs, 10_000),
      });
      return true; // handled
    }

    if (fallbackMessage) {
      toast.error(fallbackMessage);
    }
    return false; // not a circuit breaker error
  }, []);

  return { handleError };
}
