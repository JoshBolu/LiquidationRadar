import { useCallback, useEffect, useRef, useState } from "react";
import { createPublicClient, http } from "viem";
import {
  DemoOracleAbi,
  DemoOracleAddress,
} from "../contracts-abi/DemoOracle-abi";
import {
  MockBtcAddress,
  MockEthAddress,
  MockSomiAddress,
} from "../contracts-abi/MockTokens-abi";
import { somniaTestnet } from "../data/mockTokens";
import { useToast } from "../context/ToastContext";
import { getMeaningfulErrorMessage } from "../utils/errorMessage";
import {
  subscribeToPriceUpdates,
  type PriceUpdateOnly,
} from "../lib/reactivity/subscriptions";

export interface OraclePriceAsset {
  id: string;
  symbol: string;
  address: `0x${string}`;
  priceRaw: bigint;
  priceUsd: number;
}

const TOKENS = [
  { id: "mock-eth", symbol: "MOCK-ETH", address: MockEthAddress as `0x${string}` },
  { id: "mock-btc", symbol: "MOCK-BTC", address: MockBtcAddress as `0x${string}` },
  { id: "mock-somi", symbol: "MOCK-SOMI", address: MockSomiAddress as `0x${string}` },
];

const ORACLE_DECIMALS = 8;

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(),
});

/** Fetch live prices from DemoOracle.getPrices for collateral tokens. */
export function useOraclePrices() {
  const { addToast } = useToast();
  const [assets, setAssets] = useState<OraclePriceAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitializedRef = useRef(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const addresses = TOKENS.map((t) => t.address);
      const pricesRaw = (await publicClient.readContract({
        address: DemoOracleAddress,
        abi: DemoOracleAbi,
        functionName: "getPrices",
        args: [addresses],
      })) as bigint[];

      const result: OraclePriceAsset[] = TOKENS.map((t, i) => {
        const raw = pricesRaw[i];
        const priceUsd = Number(raw) / 10 ** ORACLE_DECIMALS;
        return {
          id: t.id,
          symbol: t.symbol,
          address: t.address,
          priceRaw: raw,
          priceUsd,
        };
      });
      setAssets(result);
      hasInitializedRef.current = true;
    } catch (err) {
      const msg = getMeaningfulErrorMessage(err);
      addToast(msg, "error");
      setError(msg);
      setAssets([]);
      hasInitializedRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Keep prices uniform across the whole dashboard by reacting to DemoOracle `PriceUpdated`.
  useEffect(() => {
    let cancelled = false;
    let sub: { unsubscribe: () => Promise<unknown> } | null = null;

    subscribeToPriceUpdates((update: PriceUpdateOnly) => {
      if (cancelled) return;
      if (!hasInitializedRef.current) return;

      const tokenAddr = update.token.toLowerCase();
      const meta = TOKENS.find((t) => t.address.toLowerCase() === tokenAddr);
      if (!meta) return;

      const priceRaw = update.newPrice;
      const priceUsd = Number(priceRaw) / 10 ** ORACLE_DECIMALS;

      setAssets((prev) => {
        const idx = prev.findIndex((a) => a.address.toLowerCase() === tokenAddr);
        const nextAsset: OraclePriceAsset = {
          id: meta.id,
          symbol: meta.symbol,
          address: meta.address,
          priceRaw,
          priceUsd,
        };

        if (idx === -1) return [...prev, nextAsset];
        return prev.map((a, i) => (i === idx ? nextAsset : a));
      });
    })
      .then((s) => {
        if (cancelled) {
          (s as { unsubscribe?: () => Promise<unknown> })?.unsubscribe?.().catch(() => {});
          return;
        }
        if (s instanceof Error) {
          const msg = s.message ?? "Failed to subscribe to PriceUpdated";
          setError(msg);
          addToast(msg, "error");
          return;
        }
        sub = s;
      })
      .catch((err) => {
        const msg = getMeaningfulErrorMessage(err);
        setError(msg);
        addToast(msg, "error");
      });

    return () => {
      cancelled = true;
      sub?.unsubscribe().catch(() => {});
    };
  }, [addToast]);

  return { assets, loading, error, refetch };
}
