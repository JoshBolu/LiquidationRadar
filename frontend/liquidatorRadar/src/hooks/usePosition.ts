import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { createPublicClient, http } from "viem";
import { RSCEngineAbi, RSCEngineAddress } from "../contracts-abi/RSCEngine-abi";
import { somniaTestnet } from "../data/mockTokens";
import { useToast } from "../context/ToastContext";
import { getMeaningfulErrorMessage } from "../utils/errorMessage";

export interface PositionData {
  healthFactor: bigint;
  totalDscMinted: bigint;
  collateralValueInUsd: bigint;
}

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(),
});

/** Manual read of RSCEngine.getHealthFactor and getAccountInformation for the user. */
export function usePosition(userAddress: Address | null) {
  const { addToast } = useToast();
  const [position, setPosition] = useState<PositionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userAddress) {
      setPosition(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [healthFactor, accountInfo] = await Promise.all([
        publicClient.readContract({
          address: RSCEngineAddress,
          abi: RSCEngineAbi,
          functionName: "getHealthFactor",
          args: [userAddress],
        }),
        publicClient.readContract({
          address: RSCEngineAddress,
          abi: RSCEngineAbi,
          functionName: "getAccountInformation",
          args: [userAddress],
        }),
      ]);
      const [totalDscMinted, collateralValueInUsd] = accountInfo as [bigint, bigint];
      setPosition({
        healthFactor: healthFactor as bigint,
        totalDscMinted,
        collateralValueInUsd,
      });
    } catch (err) {
      const msg = getMeaningfulErrorMessage(err);
      addToast(msg, "error");
      setError(msg);
      setPosition(null);
    } finally {
      setLoading(false);
    }
  }, [userAddress, addToast]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { position, loading, error, refetch };
}
