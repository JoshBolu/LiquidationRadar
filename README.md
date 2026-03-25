# Liquidation Radar

**Liquidation Radar** is a demo stack for an overcollateralized USD-pegged stablecoin (**RSC — ReactiveSomniaCoin**) on **Somnia Testnet**, with a **reactive dashboard** (no polling for protocol events) and an **automated liquidation bot** driven by the same on-chain events.

It shows how **health factor** monitoring, **oracle price** changes, and **liquidations** can be surfaced in real time using **Somnia Reactivity** (`@somnia-chain/reactivity`), alongside **Foundry**-deployed contracts and a **Node** bot that signs transactions with a dedicated wallet.

---

## Architecture

| Layer | Role |
|--------|------|
| **`contracts/`** | `RSCEngine` (deposit, mint, redeem, burn, liquidate), `ReactiveSomniaCoin` (RSC ERC20, engine-owned mint/burn), `DemoOracle` (demo USD prices + `PriceUpdated`), mock collateral ERC20s (`MockBtc`, `MockEth`, `MockSomi`). |
| **`bot/`** | Subscribes to `DemoOracle` + `RSCEngine` via the Reactivity SDK; tracks users in `users.json`; on `PriceUpdated`, evaluates health factors and calls `liquidate` with **ethers.js**. |
| **`frontend/liquidatorRadar/`** | React + TypeScript + Vite + Tailwind: wallet connection, lending actions, Price Lab (`stepPrice`), position and watched-address UI, **viem** reads + Reactivity subscriptions that attach **eth_calls** for live snapshots. |

---

## Key features (as implemented)

- **Overcollateralized stablecoin (RSC)** — Collateral deposited into `RSCEngine`; RSC minted against it with a **50% liquidation threshold** (documented in-engine as ~200% overcollateralization before stress).
- **Real-time price simulation** — `DemoOracle.stepPrice` moves prices by **5%** per call; **2 minute** cooldown per caller for `stepPrice` (owner `setPrice` / `setPrices` are not cooldown-limited).
- **Health factor monitoring** — `getHealthFactor` / `getAccountInformation` on the engine; positions with HF below `1e18` are liquidatable.
- **Event-driven reactivity (Somnia)** — Frontend and bot use the Reactivity SDK so protocol events can drive updates without polling those event streams.
- **Automated liquidation bot** — On `PriceUpdated`, loops tracked users, reads HF, and submits `liquidate` when unsafe.

---

## Tech stack

| Area | Technologies |
|------|----------------|
| Smart contracts | Solidity (Foundry project under `contracts/`, `solc` from `foundry.toml`), OpenZeppelin (`ReentrancyGuard`, ERC20, `Ownable`). |
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 3, **viem** 2.x, **Zustand** (persisted watched addresses), `@somnia-chain/reactivity`. |
| Bot | TypeScript, **ethers** 6.x (wallet + contracts), **viem** (chain, `decodeEventLog`, WebSocket public client), `@somnia-chain/reactivity`. |

The frontend does **not** use ethers.js; on-chain writes use **viem** `walletClient` + `publicClient`.

---

## High-level system flow

1. **Deploy** (Foundry) mock tokens, `DemoOracle`, `ReactiveSomniaCoin`, `RSCEngine`; transfer RSC ownership to the engine (see `contracts/script/DeployProject.s.sol`).
2. **Users** approve collateral, **deposit**, **mint** RSC via `RSCEngine`; optionally **redeem** collateral or **burn** RSC when repaying.
3. **`DemoOracle`** prices feed `getUsdValue` / health factor inside the engine. **`PriceUpdated`** fires whenever a price changes.
4. **Frontend** subscribes to oracle + engine contracts; each matching log triggers **simulation results** (`getHealthFactor`, `getAccountInformation` for connected + watched addresses) and updates the UI (event feed, tables, position when snapshots exist).
5. **Bot** maintains a **JSON set of user addresses** learned from `CollateralDeposited` / `RscMinted`, prunes on zero debt after `RscBurned`, and on **`PriceUpdated`** runs liquidation checks for all tracked users.

---

## How components interact

```mermaid
flowchart LR
  subgraph chain [Somnia Testnet]
    O[DemoOracle]
    E[RSCEngine]
    R[ReactiveSomniaCoin]
    M[Mock tokens]
  end
  O -->|getPrice| E
  E -->|mint/burn RSC| R
  M -->|collateral| E
  O -->|PriceUpdated| SDK[@somnia-chain/reactivity]
  E -->|engine events| SDK
  SDK --> FE[frontend liquidatorRadar]
  SDK --> BOT[bot]
  FE -->|viem txs| E
  BOT -->|ethers liquidate| E
```

---

## Repository layout

```
LiquidationRadarMVP/
├── contracts/          # Foundry: RSCEngine, ReactiveSomniaCoin, DemoOracle, mocks, tests, deploy script
├── bot/                # Liquidation bot (ethers + Reactivity subscription)
├── frontend/
│   └── liquidatorRadar/  # Vite React app (viem + Reactivity)
└── README.md           # This file
```

More detail: [`contracts/README.md`](contracts/README.md), [`bot/README.md`](bot/README.md), [`frontend/README.md`](frontend/README.md).

---

## Setup (high level)

1. **Contracts** — Install Foundry; in `contracts/`, `forge install` if needed, then `forge build` / `forge test`. Deploy with `DeployProject.s.sol` (set broadcast key as per your Foundry workflow). Update ABI JSON exports and deployed addresses in `frontend/liquidatorRadar/src/contracts-abi/` and `bot/abi/` if you redeploy.

2. **Bot** — See [`bot/README.md`](bot/README.md): Node 18+, `npm install`, configure `.env` (`SOMNIA_RPC_URL`, `PRIVATE_KEY`, optional address overrides), `npm run start`.

3. **Frontend** — From `frontend/liquidatorRadar/`: `pnpm install` (or `npm install`), `pnpm dev`. Use a browser wallet on **Somnia Testnet** (chain id **50312**).

---

## Documentation index

| Document | Contents |
|----------|----------|
| [`contracts/README.md`](contracts/README.md) | Protocol design, engine/oracle/mocks, HF & liquidation |
| [`bot/README.md`](bot/README.md) | Event subscription, `users.json`, runbook & wallet safety |
| [`frontend/README.md`](frontend/README.md) | Dashboard UI, Zustand, Reactivity + viem patterns |
