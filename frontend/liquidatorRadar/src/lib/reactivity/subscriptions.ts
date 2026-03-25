import {
  encodeFunctionData,
  decodeEventLog,
  decodeFunctionResult,
  keccak256,
  toHex,
} from "viem";
import { getSdk } from "./client";
import {
  DemoOracleAbi,
  DemoOracleAddress,
} from "../../contracts-abi/DemoOracle-abi";
import {
  RSCEngineAbi,
  RSCEngineAddress,
} from "../../contracts-abi/RSCEngine-abi";
import type {
  ProtocolReactiveUpdate,
  PositionSnapshot,
  PriceReactiveUpdate,
} from "./types";

const PriceUpdatedTopic = keccak256(
  toHex("PriceUpdated(address,address,uint256,uint256)"),
);
const CollateralDepositedTopic = keccak256(
  toHex("CollateralDeposited(address,address,uint256)"),
);
const CollateralRedeemedTopic = keccak256(
  toHex("CollateralRedeemed(address,address,address,uint256)"),
);
const RscMintedTopic = keccak256(toHex("RscMinted(address,uint256)"));
const RscBurnedTopic = keccak256(toHex("RscBurned(address,uint256)"));
const LiquidatedTopic = keccak256(
  toHex("Liquidated(address,address,address,uint256,uint256)"),
);

type Subscription = { unsubscribe: () => Promise<unknown> };

function buildEthCalls(addresses: `0x${string}`[]) {
  const calls: { to: `0x${string}`; data: `0x${string}` }[] = [];
  for (const addr of addresses) {
    calls.push({
      to: RSCEngineAddress as `0x${string}`,
      data: encodeFunctionData({
        abi: RSCEngineAbi,
        functionName: "getHealthFactor",
        args: [addr],
      }),
    });
    calls.push({
      to: RSCEngineAddress as `0x${string}`,
      data: encodeFunctionData({
        abi: RSCEngineAbi,
        functionName: "getAccountInformation",
        args: [addr],
      }),
    });
  }
  return calls;
}

function decodeSnapshots(
  addresses: `0x${string}`[],
  results: `0x${string}`[],
): PositionSnapshot[] {
  const snapshots: PositionSnapshot[] = [];
  for (let i = 0; i < addresses.length; i++) {
    const hfData = results[i * 2];
    const aiData = results[i * 2 + 1];
    if (!hfData || !aiData) continue;
    try {
      const healthFactor = decodeFunctionResult({
        abi: RSCEngineAbi,
        functionName: "getHealthFactor",
        data: hfData,
      }) as bigint;
      const accountInfo = decodeFunctionResult({
        abi: RSCEngineAbi,
        functionName: "getAccountInformation",
        data: aiData,
      }) as [bigint, bigint];
      snapshots.push({
        address: addresses[i],
        healthFactor,
        totalRscMinted: accountInfo[0],
        collateralValueInUsd: accountInfo[1],
      });
    } catch {
      // skip on decode error
    }
  }
  return snapshots;
}

function decodeProtocolUpdate(
  topics: `0x${string}`[],
  data: `0x${string}`,
  addresses: `0x${string}`[],
  simulationResults: `0x${string}`[],
): ProtocolReactiveUpdate | null {
  const topic0 = topics[0];
  if (!topic0 || !data || simulationResults.length < addresses.length * 2)
    return null;

  const snapshots = decodeSnapshots(addresses, simulationResults);
  if (snapshots.length === 0) return null;

  try {
    if (topic0 === PriceUpdatedTopic) {
      const decoded = decodeEventLog({
        abi: DemoOracleAbi,
        data,
        topics: topics as [
          `0x${string}`,
          `0x${string}`,
          `0x${string}`,
          `0x${string}`,
        ],
      });
      if (decoded.eventName !== "PriceUpdated" || !decoded.args) return null;
      const args = decoded.args as unknown as {
        updater: `0x${string}`;
        token: `0x${string}`;
        oldPrice: bigint;
        newPrice: bigint;
      };
      return {
        event: "PriceUpdated",
        updater: args.updater,
        token: args.token,
        oldPrice: args.oldPrice,
        newPrice: args.newPrice,
        snapshots,
      } satisfies PriceReactiveUpdate;
    }

    if (topic0 === CollateralDepositedTopic) {
      const decoded = decodeEventLog({
        abi: RSCEngineAbi,
        data,
        topics: topics as [
          `0x${string}`,
          `0x${string}`,
          `0x${string}`,
          `0x${string}`,
        ],
      });
      if (decoded.eventName !== "CollateralDeposited" || !decoded.args)
        return null;
      const args = decoded.args as unknown as {
        user: `0x${string}`;
        token: `0x${string}`;
        amount: bigint;
      };
      return {
        event: "CollateralDeposited",
        user: args.user,
        token: args.token,
        amount: args.amount,
        snapshots,
      };
    }

    if (topic0 === CollateralRedeemedTopic) {
      const decoded = decodeEventLog({
        abi: RSCEngineAbi,
        data,
        topics: topics as [
          `0x${string}`,
          `0x${string}`,
          `0x${string}`,
          `0x${string}`,
        ],
      });
      if (decoded.eventName !== "CollateralRedeemed" || !decoded.args)
        return null;
      const args = decoded.args as unknown as {
        redeemedFrom: `0x${string}`;
        redeemedTo: `0x${string}`;
        token: `0x${string}`;
        amount: bigint;
      };
      return {
        event: "CollateralRedeemed",
        user: args.redeemedFrom,
        redeemedFrom: args.redeemedFrom,
        redeemedTo: args.redeemedTo,
        token: args.token,
        amount: args.amount,
        snapshots,
      };
    }

    if (topic0 === RscMintedTopic) {
      const decoded = decodeEventLog({
        abi: RSCEngineAbi,
        data,
        topics: topics as [`0x${string}`, `0x${string}`, `0x${string}`],
      });
      if (decoded.eventName !== "RscMinted" || !decoded.args) return null;
      const args = decoded.args as unknown as {
        user: `0x${string}`;
        amount: bigint;
      };
      return {
        event: "RscMinted",
        user: args.user,
        amount: args.amount,
        snapshots,
      };
    }

    if (topic0 === RscBurnedTopic) {
      const decoded = decodeEventLog({
        abi: RSCEngineAbi,
        data,
        topics: topics as [`0x${string}`, `0x${string}`, `0x${string}`],
      });
      if (decoded.eventName !== "RscBurned" || !decoded.args) return null;
      const args = decoded.args as unknown as {
        user: `0x${string}`;
        amount: bigint;
      };
      return {
        event: "RscBurned",
        user: args.user,
        amount: args.amount,
        snapshots,
      };
    }

    if (topic0 === LiquidatedTopic) {
      const decoded = decodeEventLog({
        abi: RSCEngineAbi,
        data,
        topics: topics as [
          `0x${string}`,
          `0x${string}`,
          `0x${string}`,
          `0x${string}`,
        ],
      });
      if (decoded.eventName !== "Liquidated" || !decoded.args) return null;
      const args = decoded.args as unknown as {
        liquidator: `0x${string}`;
        user: `0x${string}`;
        collateral: `0x${string}`;
        debtCovered: bigint;
        collateralSeized: bigint;
      };
      return {
        event: "Liquidated",
        user: args.user,
        liquidator: args.liquidator,
        collateral: args.collateral,
        debtCovered: args.debtCovered,
        collateralSeized: args.collateralSeized,
        snapshots,
      };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Subscribe to DemoOracle + RSCEngine protocol events. On each event, runs ethCalls
 * for connected + watched addresses and delivers a decoded ProtocolReactiveUpdate.
 */
export async function subscribeToProtocolEvents(
  addresses: `0x${string}`[],
  onUpdate: (update: ProtocolReactiveUpdate) => void,
): Promise<Subscription | Error> {
  const unique = [...new Set(addresses)].filter((a) => a && a.length === 42);
  if (unique.length === 0) {
    return new Error("At least one address required");
  }

  const ethCalls = buildEthCalls(unique);
  const sdk = await getSdk();

  const result = await sdk.subscribe({
    // Listen to all events from these contracts and filter client-side.
    // This avoids being too strict with topic filters and missing events.
    eventContractSources: [DemoOracleAddress, RSCEngineAddress],
    ethCalls,
    onData(raw: {
      result?: {
        topics?: `0x${string}`[];
        data?: `0x${string}`;
        simulationResults?: `0x${string}`[];
      };
    }) {
      const res = raw?.result;
      if (!res?.topics?.length || !res.data || !res.simulationResults) return;

      const update = decodeProtocolUpdate(
        res.topics,
        res.data,
        unique,
        res.simulationResults,
      );
      if (update) onUpdate(update);
    },
  });

  if (result instanceof Error) return result;
  return result;
}

export type PriceUpdateOnly = {
  event: "PriceUpdated";
  updater: `0x${string}`;
  token: `0x${string}`;
  oldPrice: bigint;
  newPrice: bigint;
};

/**
 * Subscribe only to DemoOracle PriceUpdated events.
 * Unlike subscribeToProtocolEvents, this does NOT rely on ethCalls / snapshots.
 */
export async function subscribeToPriceUpdates(
  onUpdate: (update: PriceUpdateOnly) => void
): Promise<Subscription | Error> {
  const sdk = await getSdk();

  const result = await sdk.subscribe({
    eventContractSources: [DemoOracleAddress],
    ethCalls: [],
    onData(raw: {
      result?: {
        topics?: `0x${string}`[];
        data?: `0x${string}`;
        simulationResults?: `0x${string}`[];
      };
    }) {
      const res = raw?.result;
      if (!res?.topics?.length || !res.data) return;
      const topic0 = res.topics[0];
      if (topic0 !== PriceUpdatedTopic) return;

      try {
        const decoded = decodeEventLog({
          abi: DemoOracleAbi,
          data: res.data,
          // PriceUpdated has 2 indexed addresses, so topics are:
          // topic0 = event signature, topic1 = updater, topic2 = token
          topics: res.topics as [`0x${string}`, `0x${string}`, `0x${string}`],
        });

        if (decoded.eventName !== "PriceUpdated" || !decoded.args) return;

        const args = decoded.args as unknown as {
          updater: `0x${string}`;
          token: `0x${string}`;
          oldPrice: bigint;
          newPrice: bigint;
        };

        onUpdate({
          event: "PriceUpdated",
          updater: args.updater,
          token: args.token,
          oldPrice: args.oldPrice,
          newPrice: args.newPrice,
        });
      } catch {
        // Ignore decode errors (should be rare; the client-side filter can be imperfect).
      }
    },
  });

  if (result instanceof Error) return result;
  return result;
}
