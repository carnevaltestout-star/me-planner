import { useCallback, useEffect, useRef, useState } from "react";
import { getSetting, setSetting } from "@/lib/db/settings-repo";

// Near drop-in replacement for the old `useState(() => loadX()) +
// useEffect(() => saveX(state), [state])` pattern, for anything that's a
// single settings object/value rather than a collection of items. Starts on
// `fallback` (so the UI has something to render immediately), then swaps in
// the persisted value once the async read resolves. `normalize`, when given,
// replaces what a bespoke loadX() used to do — filling in defaults for
// fields a stored value predates, rejecting bad shapes, etc. — since a plain
// JSON.parse of whatever's in the row can't do that on its own.
type SetSetting<T> = (value: T | ((prev: T) => T)) => void;

export function useSetting<T>(key: string, fallback: T, normalize?: (raw: unknown) => T): [T, SetSetting<T>, boolean] {
  const [value, setValue] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const fallbackRef = useRef(fallback);
  const normalizeRef = useRef(normalize);
  normalizeRef.current = normalize;
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    let cancelled = false;
    getSetting<unknown>(key, fallbackRef.current).then((loaded) => {
      if (!cancelled) {
        setValue(normalizeRef.current ? normalizeRef.current(loaded) : (loaded as T));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update: SetSetting<T> = useCallback(
    (next) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(valueRef.current) : next;
      valueRef.current = resolved;
      setValue(resolved);
      void setSetting(key, resolved);
    },
    [key],
  );

  return [value, update, loading];
}
