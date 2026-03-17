import { useCallback, useEffect } from "react";
import type { Address } from "viem";
import { createPublicClient, http } from "viem";
import { MockTokensAbi } from "../contracts-abi/MockTokens-abi";
import { MOCK_TOKEN_ADDRESSES, somniaTestnet } from "../data/mockTokens";
import { useAppStore } from "../store/useAppStore";
import { useToast } from "../context/ToastContext";
import { getMeaningfulErrorMessage } from "../utils/errorMessage";
import type { TokenBalance } from "../types/dashboard";

export type { TokenBalance };

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(),
});

const ACCENT_BY_ID: Record<string, string> = {
  "mock-btc": "bg-orange-500/20 text-orange-400",
  "mock-eth": "bg-blue-500/20 text-blue-400",
  "mock-somi": "bg-purple-500/20 text-purple-400",
};

function formatBalance(raw: bigint, decimals: number): string {
  const divisor = 10 ** decimals;
  return divisor === 1
    ? String(raw)
    : (Number(raw) / divisor).toLocaleString(undefined, {
        maximumFractionDigits: 6,
      });
}

function tokensToWalletAssets(tokens: TokenBalance[]) {
  return tokens.map((t) => ({
    id: t.id,
    symbol: t.symbol.slice(0, 2).toUpperCase() || t.symbol,
    label: t.symbol,
    amount: t.balance,
    accentClasses: ACCENT_BY_ID[t.id] ?? "bg-slate-500/20 text-slate-400",
    isPrimary: false,
  }));
}

/** HTTP-only token balance fetch; state in Zustand store. No reactivity. */
export function useTokenBalances(userAddress: Address | null) {
  const { addToast } = useToast();
  const setTokenBalances = useAppStore((s) => s.setTokenBalances);
  const setWalletAssets = useAppStore((s) => s.setWalletAssets);
  const setTokensLoading = useAppStore((s) => s.setTokensLoading);
  const setTokensError = useAppStore((s) => s.setTokensError);
  const tokenBalances = useAppStore((s) => s.tokenBalances);

  const fetchBalances = useCallback(async () => {
    if (!userAddress) {
      setTokenBalances([]);
      setWalletAssets([]);
      return;
    }
    setTokensLoading(true);
    setTokensError(null);
    try {
      const results = await Promise.all(
        MOCK_TOKEN_ADDRESSES.map(async ({ address, id }) => {
          const [symbol, balance, decimals] = await Promise.all([
            publicClient.readContract({
              address,
              abi: MockTokensAbi,
              functionName: "symbol",
              args: [],
            }),
            publicClient.readContract({
              address,
              abi: MockTokensAbi,
              functionName: "balanceOf",
              args: [userAddress],
            }),
            publicClient.readContract({
              address,
              abi: MockTokensAbi,
              functionName: "decimals",
              args: [],
            }),
          ]);
          return {
            id,
            address,
            symbol: symbol as string,
            balance: formatBalance(balance as bigint, Number(decimals)),
            decimals: Number(decimals),
          };
        })
      );
      setTokenBalances(results);
      setWalletAssets(tokensToWalletAssets(results));
    } catch (err) {
      const msg = getMeaningfulErrorMessage(err);
      addToast(msg, "error");
      setTokensError(msg);
      setTokenBalances([]);
      setWalletAssets([]);
    } finally {
      setTokensLoading(false);
    }
  }, [
    userAddress,
    setTokenBalances,
    setWalletAssets,
    setTokensLoading,
    setTokensError,
    addToast,
  ]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    tokens: tokenBalances,
    loading: useAppStore((s) => s.tokensLoading),
    error: useAppStore((s) => s.tokensError),
    refetch: fetchBalances,
  };
}
