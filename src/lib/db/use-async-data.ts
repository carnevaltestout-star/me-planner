import { useCallback, useEffect, useState } from "react";

// For real content collections — an array, or a Record<id, item> (several
// features here key their collection by id rather than use an array).
// Loads once via `loader`, starting from `initial` so there's something to
// render before that resolves. Components call repo CRUD functions
// directly from event handlers and update `data` themselves (optimistically)
// or call `refresh()` — rewriting the whole collection back to the DB on
// every change would defeat the point of having real per-item rows.
export function useAsyncData<T>(loader: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  // A failed load previously left `loading` stuck true forever and `data`
  // silently frozen at `initial` — indistinguishable from "this collection
  // is genuinely empty" (e.g. every goal you'd created reads as gone the
  // next time this remounts). Surfacing the error at least makes the
  // failure visible/loggable instead of masquerading as empty data.
  const [error, setError] = useState<unknown>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    return loader()
      .then((loaded) => {
        setData(loaded);
        setLoading(false);
      })
      .catch((err) => {
        console.error("useAsyncData: load failed", err);
        setError(err);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loader()
      .then((loaded) => {
        if (!cancelled) {
          setData(loaded);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("useAsyncData: load failed", err);
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, setData, loading, error, refresh } as const;
}
