import { SDK } from "@somnia-chain/reactivity";
import {
  createPublicClient,
  decodeEventLog,
  keccak256,
  toHex,
  webSocket,
} from "viem";
import { somniaTestnet } from "./chain";
import { engine, engineAddress, oracleAddress } from "./contracts";
import { saveUsers } from "./storage";
import { checkAndLiquidateUsers } from "./liquidator";
import { DemoOracleAbi } from "../abi/DemoOracle-abi";
import { RSCEngineAbi } from "../abi/RSCEngine-abi";

const collateralDepositedTopic = keccak256(
  toHex("CollateralDeposited(address,address,uint256)"),
);
const rscMintedTopic = keccak256(toHex("RscMinted(address,uint256)"));
const rscBurnedTopic = keccak256(toHex("RscBurned(address,uint256)"));
const priceUpdatedTopic = keccak256(
  toHex("PriceUpdated(address,address,uint256,uint256)"),
);

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: webSocket(),
});
const sdk = new SDK({ public: publicClient });

function addUser(users: Set<string>, user: string): void {
  const normalized = user.toLowerCase();
  const before = users.size;
  users.add(normalized);
  if (users.size !== before) {
    saveUsers(users);
    console.log(`[users] added ${normalized}`);
  }
}

async function handleBurnCleanup(
  users: Set<string>,
  user: string,
): Promise<void> {
  const normalized = user.toLowerCase();
  const minted = (await engine.getRscMinted(normalized)) as bigint;

  if (minted === 0n && users.delete(normalized)) {
    saveUsers(users);
    console.log(`[users] removed ${normalized} (burn cleanup)`);
    return;
  }

  console.log(
    `[users] burn cleanup kept ${normalized} (minted=${minted.toString()})`,
  );
}

export async function startListeners(users: Set<string>): Promise<void> {
  const result = await sdk.subscribe({
    eventContractSources: [
      oracleAddress as `0x${string}`,
      engineAddress as `0x${string}`,
    ],
    ethCalls: [],
    onData(raw: {
      result?: {
        topics?: `0x${string}`[];
        data?: `0x${string}`;
      };
    }) {
      const topics = raw.result?.topics;
      const data = raw.result?.data;
      if (!topics?.length || !data) {
        return;
      }

      const topic0 = topics[0];
      if (!topic0) {
        return;
      }
      const eventTopics = topics as [`0x${string}`, ...`0x${string}`[]];

      if (topic0 === collateralDepositedTopic || topic0 === rscMintedTopic) {
        try {
          const decoded = decodeEventLog({
            abi: RSCEngineAbi,
            data,
            topics: eventTopics,
          });
          if (
            decoded.eventName === "CollateralDeposited" ||
            decoded.eventName === "RscMinted"
          ) {
            const user = String((decoded.args as { user?: string }).user ?? "");
            if (user) {
              addUser(users, user);
            }
          }
        } catch (error) {
          console.error("[reactivity] decode failed for add-user event", error);
        }
        return;
      }

      if (topic0 === rscBurnedTopic) {
        try {
          const decoded = decodeEventLog({
            abi: RSCEngineAbi,
            data,
            topics: eventTopics,
          });
          if (decoded.eventName === "RscBurned") {
            const user = String((decoded.args as { user?: string }).user ?? "");
            if (user) {
              void handleBurnCleanup(users, user).catch((error) => {
                console.error(`[users] burn cleanup failed for ${user}`, error);
              });
            }
          }
        } catch (error) {
          console.error("[reactivity] decode failed for burn event", error);
        }
        return;
      }

      if (topic0 === priceUpdatedTopic) {
        try {
          const decoded = decodeEventLog({
            abi: DemoOracleAbi,
            data,
            topics: eventTopics,
          });
          if (decoded.eventName === "PriceUpdated") {
            const args = decoded.args as {
              token?: string;
              oldPrice?: bigint;
              newPrice?: bigint;
            };
            const token = String(args.token ?? "");
            const oldPrice = BigInt(args.oldPrice ?? 0n);
            const newPrice = BigInt(args.newPrice ?? 0n);
            console.log(
              `[oracle] PriceUpdated token=${token} old=${oldPrice.toString()} new=${newPrice.toString()} users=${users.size}`,
            );
            void checkAndLiquidateUsers(users).catch((error) => {
              console.error(
                "[health] price-triggered liquidation loop failed",
                error,
              );
            });
          }
        } catch (error) {
          console.error("[reactivity] decode failed for price event", error);
        }
      }
    },
    onError(error: unknown) {
      console.error("[reactivity] subscription error", error);
    },
  });

  if (result instanceof Error) {
    throw result;
  }

  console.log(
    "[listeners] subscribed to CollateralDeposited, RscMinted, RscBurned, PriceUpdated",
  );
}
