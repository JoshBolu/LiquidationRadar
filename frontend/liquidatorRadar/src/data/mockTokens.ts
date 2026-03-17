import type { Address } from "viem";
import {
  MockBtcAddress,
  MockEthAddress,
  MockSomiAddress,
} from "../contracts-abi/MockTokens-abi";

export const SOMNIA_TESTNET_RPC = "https://dream-rpc.somnia.network";
/** WebSocket URL required for Somnia Reactivity (event-driven reads). */
export const SOMNIA_TESTNET_WSS = "wss://dream-rpc.somnia.network";

/** Somnia Testnet (Shannon) - chainId 50312 */
export const somniaTestnet = {
  id: 50312,
  name: "Somnia Testnet",
  nativeCurrency: { name: "Somnia", symbol: "SOM", decimals: 8 },
  rpcUrls: {
    default: {
      http: [SOMNIA_TESTNET_RPC],
      webSocket: [SOMNIA_TESTNET_WSS],
    },
  },
} as const;

export const MOCK_TOKEN_ADDRESSES: { address: Address; id: string }[] = [
  { address: MockBtcAddress as Address, id: "mock-btc" },
  { address: MockEthAddress as Address, id: "mock-eth" },
  { address: MockSomiAddress as Address, id: "mock-somi" },
];
