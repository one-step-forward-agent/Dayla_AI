import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";
import { errorText } from "./format";

export interface AsyncState<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
  setData: (data: T) => void;
}

export function useAsync<T>(load: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const stableLoad = useCallback(load, deps);

  const reload = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    try {
      const result = await stableLoad();
      if (current === generation.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (current === generation.current) setError(errorText(err));
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [stableLoad]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

export function useAction(onError: (message: string) => void) {
  const [pending, setPending] = useState<string | null>(null);
  const run = useCallback(
    async <T,>(key: string, action: () => Promise<T>): Promise<T | undefined> => {
      setPending(key);
      try {
        return await action();
      } catch (err) {
        onError(errorText(err));
        return undefined;
      } finally {
        setPending(null);
      }
    },
    [onError],
  );
  return { pending, run };
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}
