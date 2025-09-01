import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { HealthResponse } from "../types";

export function useHealth() {
  const [data, setData] = useState<HealthResponse | undefined>();
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(undefined);
    try {
      const d = await api.health();
      setData(d);
    } catch (e) {
      setError(e as Error);
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
