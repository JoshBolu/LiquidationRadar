import { useEffect, useRef, useState } from "react";
import { subscribeToPriceUpdates } from "../lib/reactivity/priceSubscription";
import type { PriceReactiveUpdate } from "../lib/reactivity/types";

/**
 * Subscribe to DemoOracle.PriceUpdated and expose the latest reactive update for the watched address.
 * Subscribes on mount / watchedAddress change; unsubscribes on cleanup.
 */
export function usePriceReactivity(watchedAddress: `0x${string}` | null) {
  const [update, setUpdate] = useState<PriceReactiveUpdate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const subRef = useRef<{ unsubscribe: () => Promise<unknown> } | null>(null);

  useEffect(() => {
    if (!watchedAddress) {
      setUpdate(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    let cancelled = false;

    subscribeToPriceUpdates(watchedAddress, (next) => {
      if (!cancelled) setUpdate(next);
    }).then((sub) => {
      if (cancelled) {
        if (sub && typeof sub === "object" && "unsubscribe" in sub) {
          (sub as { unsubscribe: () => Promise<unknown> }).unsubscribe().catch(() => {});
        }
        return;
      }
      setLoading(false);
      if (sub instanceof Error) {
        setError(sub);
        return;
      }
      subRef.current = sub;
    });

    return () => {
      cancelled = true;
      const s = subRef.current;
      subRef.current = null;
      s?.unsubscribe().catch(() => {});
    };
  }, [watchedAddress]);

  return { update, loading, error };
}
