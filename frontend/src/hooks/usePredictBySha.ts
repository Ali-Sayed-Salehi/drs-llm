// src/hooks/usePredictBySha.ts
import { useCallback, useState } from "react";
import { api } from "../api";
import type { PredictBySHARequest, PredictResponse } from "../types";

export function usePredictBySha() {
  const [data, setData] = useState<PredictResponse | undefined>();
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const mutate = useCallback(async (body: PredictBySHARequest) => {
    setPending(true);
    setError(undefined);
    try {
      const d = await api.predictBySha(body);
      setData(d);
    } catch (e) {
      setError(e as Error);
    } finally {
      setPending(false);
    }
  }, []);

  const reset = () => setData(undefined);

  return { data, isPending, isError: !!error, error, mutate, reset };
}
