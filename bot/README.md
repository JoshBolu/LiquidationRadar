# Liquidation Radar — Liquidation bot

TypeScript service that **subscribes** to Somnia Testnet events via **`@somnia-chain/reactivity`**, maintains a **set of borrower addresses** on disk, and on **`PriceUpdated`** evaluates **`getHealthFactor`** for each tracked user and submits **`RSCEngine.liquidate`** when HF &lt; `1e18`.

Transactions are signed with **`ethers.js` v6** using a **`PRIVATE_KEY`** supplied at runtime in the process environment (dedicated bot wallet — see [Wallet safety](#wallet-safety)). Prefer passing it via a **shell session** (see [Clone and run](#clone-and-run)), not a file on disk.

---

## Purpose

- Automate **undercollateralized** position cleanup on the demo protocol.
- Avoid scanning the chain from scratch: users are **added** when they **`CollateralDeposited`** or **`RscMinted`**, and **removed** when **`RscBurned`** leads to **zero** RSC debt.

---

## How it works (event-driven)

1. On startup, load **`users.json`**, optionally remove addresses with **zero** minted RSC, **approve** RSC spending for the engine if needed (`MaxUint256`).
2. **`startListeners`** opens a Reactivity **`subscribe`** with:
   - **`eventContractSources`**: `DemoOracle` and `RSCEngine` addresses
   - **`ethCalls`**: empty (bot only reacts to decoded logs, not simulation bundles)
3. **`onData`** inspects `topic0`:
   - **`CollateralDeposited`** / **`RscMinted`** → decode with `RSCEngine` ABI → **`addUser`**
   - **`RscBurned`** → **`handleBurnCleanup`**: if `getRscMinted(user) == 0`, remove user
   - **`PriceUpdated`** → **`checkAndLiquidateUsers(users)`**

There is **no polling loop** for prices; liquidation checks run when **`PriceUpdated`** fires.

---

## Subscribed events

| Topic / event | Source | Bot action |
|---------------|--------|------------|
| `CollateralDeposited` | `RSCEngine` | Add `user` to set, persist |
| `RscMinted` | `RSCEngine` | Add `user` to set, persist |
| `RscBurned` | `RSCEngine` | Remove user if minted RSC is 0 |
| `PriceUpdated` | `DemoOracle` | For each user: `getHealthFactor`; if unsafe, `tryLiquidateUser` |

---

## Internal liquidation flow

1. **`checkAndLiquidateUsers`** — Batch `getHealthFactor` for all users; for each with HF &lt; `1e18`, call **`tryLiquidateUser`**.
2. **`tryLiquidateUser`**:
   - Skip if HF ≥ `1e18` or minted RSC is 0.
   - Load **`getCollateralTokens()`** (cached).
   - For each token, **`getCollateralBalanceOfUser`**; compute **`getUsdValue`** per token.
   - Pick the token with **highest USD value** (`bestToken`).
   - **`maxDebtCoverable = bestUsd * 100 / (100 + 10)`** so the seized collateral (including **10% bonus**) does not exceed the user’s position in that asset (matches engine’s 10% liquidator bonus).
   - **`debtToCover = min(totalDebt, maxDebtCoverable)`** (partial liquidation when needed).
   - **`engine.liquidate(bestToken, user, debtToCover)`** via ethers **`Contract`**.

---

## Data persistence

- **File**: `bot/users.json` (next to the compiled/runtime path; source lives under `bot/users.json` in repo).
- **Shape**: `{ "users": ["0x...", ...] }` (lowercased when loaded/saved).
- Created automatically as empty if missing.

---

## Transactions (bot wallet)

- **`provider.ts`**: `JsonRpcProvider(SOMNIA_RPC_URL)` + `Wallet(PRIVATE_KEY)`.
- **`contracts.ts`**: ethers **`Contract`** instances for engine, oracle, RSC with the wallet as signer.
- **Approval**: on startup, **`rsc.approve(engine, MaxUint256)`** if allowance is not already max (so **`liquidate`** can **`transferFrom`** RSC from the bot to burn).

---

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `SOMNIA_RPC_URL` | Yes | HTTP JSON-RPC URL for Somnia Testnet |
| `PRIVATE_KEY` | Yes | Hex private key for the bot account (with `0x` prefix as typically used by ethers). Set in the shell when you start the process — do **not** put it in `.env`. |
| `RSC_ENGINE_ADDRESS` | No | Overrides default in `abi/RSCEngine-abi.ts` |
| `DEMO_ORACLE_ADDRESS` | No | Overrides default in `abi/DemoOracle-abi.ts` |
| `RSC_ADDRESS` | No | Overrides default in `abi/ReactiveSomniaCoin-abi.ts` |

Chain metadata for viem is **`chainId` 50312** (`bot/src/chain.ts`); WebSocket URL is used for the Reactivity public client.

---

## Wallet safety

**Do not use a main wallet or seed phrase that holds real funds across chains.**

- **Create a new wallet** used only for this bot (e.g. a fresh account in MetaMask or `cast wallet new`, then export the private key if you must).
- Fund it with **only enough native SOM** on Somnia Testnet to pay gas for `approve` and `liquidate` txs.
- **Do not store the private key in `.env` or any committed file.** Prefer typing it once per session (hidden prompt), `export` for the current shell, run the bot, then `unset` so it is not left in the environment or on disk.
- Rotate the key if it is ever leaked.

---

## Clone and run

From your machine (replace the clone URL with your fork or this repo):

```bash
git clone <repository-url> LiquidationRadarMVP
cd LiquidationRadarMVP/bot
npm install
```

Optional: create **`bot/.env`** for **non-secret** values only (for example `SOMNIA_RPC_URL` and optional `*_ADDRESS` overrides). **`dotenv` does not override variables already set in the shell**, so a **`PRIVATE_KEY` you `export` in the shell is never replaced by a file.**

```env
SOMNIA_RPC_URL=https://dream-rpc.somnia.network
# Optional if you redeployed:
# RSC_ENGINE_ADDRESS=0x...
# DEMO_ORACLE_ADDRESS=0x...
# RSC_ADDRESS=0x...
```

Build (optional), then start with the key only in the current shell session:

```bash
npm run build   # optional
read -s -p "Private key: " PRIVATE_KEY; echo
export PRIVATE_KEY
npm run start
unset PRIVATE_KEY
```

`npm run start` runs **`ts-node src/index.ts`**. You should see startup logs, approval logs if needed, then **`[listeners] subscribed to ...`** and **`[bot] running and waiting for events...`**.

Ensure deployed contract addresses in **`bot/abi/*-abi.ts`** match the network you use, or set the `*_ADDRESS` env overrides.

If you prefer not to use `.env` at all, **`export SOMNIA_RPC_URL=...`** (and any overrides) in the same shell before `npm run start`.

---

## Dependencies (summary)

- **`ethers`** — wallet, contracts, `MaxUint256` approval
- **`viem`** — `createPublicClient`, `webSocket`, `decodeEventLog`, `keccak256` / topics
- **`@somnia-chain/reactivity`** — `SDK.subscribe`
- **`dotenv`** — loaded in `provider.ts`

---

## Related docs

- [Root README](../README.md) — full system overview  
- [Contracts README](../contracts/README.md) — `liquidate` and HF rules  
- [Frontend README](../frontend/README.md) — dashboard and Reactivity from the browser  
