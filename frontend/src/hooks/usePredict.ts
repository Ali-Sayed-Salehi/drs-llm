// src/hooks/usePredict.ts
import { useCallback, useState } from "react";
import { api } from "../api";
import type { PredictRequest, PredictResponse } from "../types";

export function usePredict() {
  const [data, setData] = useState<PredictResponse | undefined>();
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const mutate = useCallback(async (body: PredictRequest) => {
    setPending(true);
    setError(undefined);
    try {
      const d = await api.predict(body);
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
