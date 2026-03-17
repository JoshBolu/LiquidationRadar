import { useCallback, useEffect, useState } from "react";
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
    } catch (err) {
      const msg = getMeaningfulErrorMessage(err);
      addToast(msg, "error");
      setError(msg);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { assets, loading, error, refetch };
}
