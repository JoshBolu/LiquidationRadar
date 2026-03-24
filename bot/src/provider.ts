import "dotenv/config";
import { JsonRpcProvider, Wallet } from "ethers";

const rpcUrl = process.env.SOMNIA_RPC_URL;
const privateKey = process.env.PRIVATE_KEY;

if (!rpcUrl) {
  throw new Error("Missing SOMNIA_RPC_URL in environment");
}

if (!privateKey) {
  throw new Error("Missing PRIVATE_KEY in environment");
}

export const provider = new JsonRpcProvider(rpcUrl);
export const wallet = new Wallet(privateKey, provider);
