import { useCallback, useEffect, useRef, useState } from "react";
import { subscribe } from "@/services";

/**
 * Small async reader for the demo services. Re-runs when a dependency changes
 * and whenever the in-memory store is mutated elsewhere in the app.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    fnRef.current().then((v) => {
      if (!cancelled) {
        setData(v);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);
  useEffect(() => subscribe(() => void run()) as unknown as () => void, [run]);

  return { data, loading, reload: run };
}
