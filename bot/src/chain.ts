import { defineChain } from "viem";

/** Somnia Testnet (Shannon) - chainId 50312 */
export const somniaTestnet = defineChain({
  id: 50312,
  name: "Somnia Testnet",
  nativeCurrency: { name: "Somnia", symbol: "SOM", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://dream-rpc.somnia.network"],
      webSocket: ["ws://api.infra.testnet.somnia.network/ws"],
    },
  },
});
