import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { createPublicClient, http } from "viem";
import { RSCEngineAbi, RSCEngineAddress } from "../contracts-abi/RSCEngine-abi";
import { MockTokensAbi } from "../contracts-abi/MockTokens-abi";
import { somniaTestnet, MOCK_TOKEN_ADDRESSES } from "../data/mockTokens";
import { useToast } from "../context/ToastContext";
import { getMeaningfulErrorMessage } from "../utils/errorMessage";

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(),
});

export interface CollateralTokenPosition {
  id: string;
  address: Address;
  symbol: string;
  amount: string;
  usd: string;
}

export function useCollateralBreakdown(userAddress: Address | null) {
  const { addToast } = useToast();
  const [tokens, setTokens] = useState<CollateralTokenPosition[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!userAddress) {
      setTokens([]);
      return;
    }
    setLoading(true);
    try {
      const results: CollateralTokenPosition[] = [];
      for (const { address, id } of MOCK_TOKEN_ADDRESSES) {
        const [symbol, balance] = await Promise.all([
          publicClient.readContract({
            address,
            abi: MockTokensAbi,
            functionName: "symbol",
            args: [],
          }),
          publicClient.readContract({
            address: RSCEngineAddress,
            abi: RSCEngineAbi,
            functionName: "getCollateralBalanceOfUser",
            args: [userAddress, address],
          }),
        ]);
        const rawBalance = balance as bigint;
        if (rawBalance === 0n) continue;
        const rawUsd = (await publicClient.readContract({
          address: RSCEngineAddress,
          abi: RSCEngineAbi,
          functionName: "getUsdValue",
          args: [address, rawBalance],
        })) as bigint;
        const amount = (Number(rawBalance) / 1e18).toFixed(4);
        // Position card "token price" (USD) should be readable; keep 2 decimals.
        const usd = (Number(rawUsd) / 1e18).toFixed(2);
        results.push({
          id,
          address,
          symbol: symbol as string,
          amount,
          usd,
        });
      }
      setTokens(results);
    } catch (err) {
      addToast(getMeaningfulErrorMessage(err), "error");
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }, [userAddress, addToast]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { tokens, loading, refetch };
}

