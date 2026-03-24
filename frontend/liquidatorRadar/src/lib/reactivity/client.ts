import { createPublicClient, webSocket } from "viem";
import type { SDK } from "@somnia-chain/reactivity";
import { somniaTestnet } from "./chain";

let sdkInstance: SDK | null = null;

async function ensureBuffer(): Promise<void> {
  const g = globalThis as typeof globalThis & { Buffer?: unknown };
  if (typeof g.Buffer === "undefined") {
    const { Buffer } = await import("buffer");
    g.Buffer = Buffer;
  }
}

/**
 * Returns the Somnia Reactivity SDK. Uses WebSocket public client only (no wallet).
 * Lazy-init so Buffer polyfill can run first.
 */
export async function getSdk(): Promise<SDK> {
  await ensureBuffer();
  if (!sdkInstance) {
    const { SDK: SDKClass } = await import("@somnia-chain/reactivity");
    const publicClient = createPublicClient({
      chain: somniaTestnet,
      transport: webSocket(),
    });
    sdkInstance = new SDKClass({ public: publicClient });
  }
  return sdkInstance;
}
