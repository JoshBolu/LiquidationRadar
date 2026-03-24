import { MaxUint256 } from "ethers";
import { wallet } from "./provider";
import { engine, rsc } from "./contracts";
import { loadUsers, saveUsers } from "./storage";
import { startListeners } from "./listeners";

async function startupCleanup(users: Set<string>): Promise<void> {
  const staleUsers: string[] = [];

  for (const user of users) {
    const minted = (await engine.getDscMinted(user)) as bigint;
    if (minted === 0n) {
      staleUsers.push(user);
    }
  }

  if (staleUsers.length === 0) {
    console.log("[startup] no stale users found");
    return;
  }

  for (const user of staleUsers) {
    users.delete(user);
    console.log(`[startup] removed stale user ${user}`);
  }
  saveUsers(users);
}

async function setupApproval(): Promise<void> {
  const owner = await wallet.getAddress();
  const spender = await engine.getAddress();
  const allowance = (await rsc.allowance(owner, spender)) as bigint;

  if (allowance === MaxUint256) {
    console.log(`[approval] existing allowance=${allowance.toString()} (skip approve)`);
    return;
  }

  const tx = await rsc.approve(spender, MaxUint256);
  console.log(`[approval] approve tx sent ${tx.hash}`);
  await tx.wait();
  console.log("[approval] approve confirmed");
}

async function main(): Promise<void> {
  const users = loadUsers();
  console.log(`[startup] loaded users=${users.size}`);

  await startupCleanup(users);
  await setupApproval();
  await startListeners(users);

  console.log("[bot] running and waiting for events...");
}

main().catch((error) => {
  console.error("[bot] fatal error", error);
  process.exit(1);
});
