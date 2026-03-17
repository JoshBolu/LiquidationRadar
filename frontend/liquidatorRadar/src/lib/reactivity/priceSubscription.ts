import {
  encodeFunctionData,
  decodeEventLog,
  decodeFunctionResult,
  getEventSelector,
} from "viem";
import { getSdk } from "./client";
import { DemoOracleAbi, DemoOracleAddress } from "../../contracts-abi/DemoOracle-abi";
import { RSCEngineAbi, RSCEngineAddress } from "../../contracts-abi/RSCEngine-abi";
import type { PriceReactiveUpdate } from "./types";

const PriceUpdatedTopic = getEventSelector(
  "PriceUpdated(address,address,uint256,uint256)"
);

type Subscription = { unsubscribe: () => Promise<unknown> };

/**
 * Subscribe to DemoOracle.PriceUpdated and receive one clean payload per event
 * containing the price event plus RSCEngine.getHealthFactor and getAccountInformation for the watched address.
 * Returns the subscription so the caller can unsubscribe.
 */
export async function subscribeToPriceUpdates(
  watchedAddress: `0x${string}`,
  onUpdate: (update: PriceReactiveUpdate) => void
): Promise<Subscription | Error> {
  const sdk = await getSdk();

  const ethCalls = [
    {
      to: RSCEngineAddress as `0x${string}`,
      data: encodeFunctionData({
        abi: RSCEngineAbi,
        functionName: "getHealthFactor",
        args: [watchedAddress],
      }),
    },
    {
      to: RSCEngineAddress as `0x${string}`,
      data: encodeFunctionData({
        abi: RSCEngineAbi,
        functionName: "getAccountInformation",
        args: [watchedAddress],
      }),
    },
  ];

  const result = await sdk.subscribe({
    eventContractSources: [DemoOracleAddress],
    topicOverrides: [PriceUpdatedTopic],
    ethCalls,
    onData(raw: { result?: { topics?: `0x${string}`[]; data?: `0x${string}`; simulationResults?: `0x${string}`[] } }) {
      const res = raw?.result;
      if (!res?.topics?.length || !res.data || !res.simulationResults || res.simulationResults.length < 2) return;

      try {
        const decoded = decodeEventLog({
          abi: DemoOracleAbi,
          data: res.data,
          topics: res.topics as [`0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`],
        });
        if (decoded.eventName !== "PriceUpdated" || !decoded.args) return;
        const args = decoded.args as unknown as {
          updater: `0x${string}`;
          token: `0x${string}`;
          oldPrice: bigint;
          newPrice: bigint;
        };

        const healthFactor = decodeFunctionResult({
          abi: RSCEngineAbi,
          functionName: "getHealthFactor",
          data: res.simulationResults[0],
        }) as bigint;
        const accountInfo = decodeFunctionResult({
          abi: RSCEngineAbi,
          functionName: "getAccountInformation",
          data: res.simulationResults[1],
        }) as [bigint, bigint];

        const update: PriceReactiveUpdate = {
          updater: args.updater,
          token: args.token,
          oldPrice: args.oldPrice,
          newPrice: args.newPrice,
          watchedAddress,
          healthFactor,
          totalDscMinted: accountInfo[0],
          collateralValueInUsd: accountInfo[1],
        };
        onUpdate(update);
      } catch {
        // Decode failed; skip this push
      }
    },
  });

  if (result instanceof Error) return result;
  return result;
}
