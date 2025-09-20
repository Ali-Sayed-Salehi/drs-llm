// src/hooks/useHealth.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { api, type GatewayHealth } from "../api";

function isAbortError(err: unknown): boolean {
  // DOMException with name "AbortError" in browsers
  return typeof err === "object" && err !== null && "name" in err && (err as { name?: unknown }).name === "AbortError";
}

export function useHealth() {
  const [data, setData] = useState<GatewayHealth | undefined>();
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(undefined);
    try {
      const d = await api.health(abortRef.current.signal);
      setData(d);
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  return { data, isLoading, isError: !!error, error, refetch };
}
