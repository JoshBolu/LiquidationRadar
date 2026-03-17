import { useCallback, useState } from "react";
import type { Address } from "viem";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { DemoOracleAbi, DemoOracleAddress } from "../contracts-abi/DemoOracle-abi";
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

function getWalletClient() {
  if (!window.ethereum) return null;
  return createWalletClient({
    chain: somniaTestnet,
    transport: custom(window.ethereum as { request: (args: unknown) => Promise<unknown> }),
  });
}

/** Call DemoOracle.stepPrice(token, increase) — ±5% price step (2 min cooldown per caller). */
export function useStepPrice(onSuccess?: () => void) {
  const { addToast } = useToast();
  const [pending, setPending] = useState<Address | null>(null);

  const stepPrice = useCallback(
    async (tokenAddress: Address, increase: boolean) => {
      if (!window.ethereum) {
        addToast(getMeaningfulErrorMessage("Connect your wallet first"), "error");
        return;
      }
      const wallet = getWalletClient();
      if (!wallet) {
        addToast(getMeaningfulErrorMessage("No wallet"), "error");
        return;
      }
      const [account] = await wallet.getAddresses();
      if (!account) {
        addToast(getMeaningfulErrorMessage("No account"), "error");
        return;
      }
      setPending(tokenAddress);
      try {
        const gas = await publicClient.estimateContractGas({
          address: DemoOracleAddress,
          abi: DemoOracleAbi,
          functionName: "stepPrice",
          args: [tokenAddress, increase],
          account,
        });
        const hash = await wallet.writeContract({
          address: DemoOracleAddress,
          abi: DemoOracleAbi,
          functionName: "stepPrice",
          args: [tokenAddress, increase],
          account,
          gas,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        onSuccess?.();
      } catch (err) {
        addToast(getMeaningfulErrorMessage(err), "error");
      } finally {
        setPending(null);
      }
    },
    [addToast, onSuccess]
  );

  return { stepPrice, pending };
}
