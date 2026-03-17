import { useCallback, useState } from "react";
import type { Address } from "viem";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { MockTokensAbi } from "../contracts-abi/MockTokens-abi";
import { RSCEngineAbi, RSCEngineAddress } from "../contracts-abi/RSCEngine-abi";
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

export function useLendingActions(userAddress: Address | null) {
  const { addToast } = useToast();
  const [pending, setPending] = useState<string | null>(null);

  const runTx = useCallback(
    async (
      label: string,
      fn: (account: Address) => Promise<`0x${string}`>
    ) => {
      if (!userAddress || !window.ethereum) {
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
      setPending(label);
      try {
        const hash = await fn(account);
        await publicClient.waitForTransactionReceipt({ hash });
      } catch (err) {
        addToast(getMeaningfulErrorMessage(err), "error");
      } finally {
        setPending(null);
      }
    },
    [userAddress, addToast]
  );

  const approve = useCallback(
    async (tokenAddress: Address, amount: bigint) => {
      await runTx("approve", async (account) => {
        const gas = await publicClient.estimateContractGas({
          address: tokenAddress,
          abi: MockTokensAbi,
          functionName: "approve",
          args: [RSCEngineAddress, amount],
          account,
        });
        return getWalletClient()!.writeContract({
          address: tokenAddress,
          abi: MockTokensAbi,
          functionName: "approve",
          args: [RSCEngineAddress, amount],
          account,
          gas,
        }) as Promise<`0x${string}`>;
      });
    },
    [runTx]
  );

  const depositCollateral = useCallback(
    async (tokenAddress: Address, amount: bigint) => {
      await runTx("deposit", async (account) => {
        const gas = await publicClient.estimateContractGas({
          address: RSCEngineAddress,
          abi: RSCEngineAbi,
          functionName: "depositCollateral",
          args: [tokenAddress, amount],
          account,
        });
        return getWalletClient()!.writeContract({
          address: RSCEngineAddress,
          abi: RSCEngineAbi,
          functionName: "depositCollateral",
          args: [tokenAddress, amount],
          account,
          gas,
        }) as Promise<`0x${string}`>;
      });
    },
    [runTx]
  );

  const mintDsc = useCallback(
    async (amount: bigint) => {
      await runTx("mint", async (account) => {
        const gas = await publicClient.estimateContractGas({
          address: RSCEngineAddress,
          abi: RSCEngineAbi,
          functionName: "mintDsc",
          args: [amount],
          account,
        });
        return getWalletClient()!.writeContract({
          address: RSCEngineAddress,
          abi: RSCEngineAbi,
          functionName: "mintDsc",
          args: [amount],
          account,
          gas,
        }) as Promise<`0x${string}`>;
      });
    },
    [runTx]
  );

  const burnDsc = useCallback(
    async (amount: bigint) => {
      await runTx("burn", async (account) => {
        const gas = await publicClient.estimateContractGas({
          address: RSCEngineAddress,
          abi: RSCEngineAbi,
          functionName: "burnDsc",
          args: [amount],
          account,
        });
        return getWalletClient()!.writeContract({
          address: RSCEngineAddress,
          abi: RSCEngineAbi,
          functionName: "burnDsc",
          args: [amount],
          account,
          gas,
        }) as Promise<`0x${string}`>;
      });
    },
    [runTx]
  );

  const redeemCollateral = useCallback(
    async (tokenAddress: Address, amount: bigint) => {
      await runTx("redeem", async (account) => {
        const gas = await publicClient.estimateContractGas({
          address: RSCEngineAddress,
          abi: RSCEngineAbi,
          functionName: "redeemCollateral",
          args: [tokenAddress, amount],
          account,
        });
        return getWalletClient()!.writeContract({
          address: RSCEngineAddress,
          abi: RSCEngineAbi,
          functionName: "redeemCollateral",
          args: [tokenAddress, amount],
          account,
          gas,
        }) as Promise<`0x${string}`>;
      });
    },
    [runTx]
  );

  return {
    approve,
    depositCollateral,
    mintDsc,
    burnDsc,
    redeemCollateral,
    pending,
  };
}
