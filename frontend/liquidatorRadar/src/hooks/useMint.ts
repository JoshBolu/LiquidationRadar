import { useCallback, useState } from "react";
import type { Address } from "viem";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { MockTokensAbi } from "../contracts-abi/MockTokens-abi";
import { somniaTestnet } from "../data/mockTokens";
import { useToast } from "../context/ToastContext";
import { getMeaningfulErrorMessage } from "../utils/errorMessage";

declare global {
  interface Window {
    ethereum?: unknown;
  }
}

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(),
});

export function useMint(userAddress: Address | null) {
  const { addToast } = useToast();
  const [pendingToken, setPendingToken] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mint = useCallback(
    async (tokenAddress: Address) => {
      if (!userAddress || !window.ethereum) {
        const msg = "Connect your wallet first";
        addToast(getMeaningfulErrorMessage(msg), "error");
        setError(msg);
        return;
      }
      setPendingToken(tokenAddress);
      setError(null);
      try {
        const eth = window.ethereum as {
          request: (args: unknown) => Promise<unknown>;
        };
        const walletClient = createWalletClient({
          chain: somniaTestnet,
          transport: custom(eth),
        });
        const [account] = await walletClient.getAddresses();
        if (!account) {
          const msg = "No account found";
          addToast(getMeaningfulErrorMessage(msg), "error");
          setError(msg);
          return;
        }
        const gas = await publicClient.estimateContractGas({
          address: tokenAddress,
          abi: MockTokensAbi,
          functionName: "mintOnInterval",
          account,
        });
        const hash = await walletClient.writeContract({
          address: tokenAddress,
          abi: MockTokensAbi,
          functionName: "mintOnInterval",
          account,
          gas,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      } catch (err) {
        const msg = getMeaningfulErrorMessage(err);
        addToast(msg, "error");
        setError(msg);
      } finally {
        setPendingToken(null);
      }
    },
    [userAddress],
  );

  return { mint, pendingToken, error };
}
