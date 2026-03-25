# Liquidation Radar — Frontend

The UI lives in **`liquidatorRadar/`**: a **Vite + React 19 + TypeScript** app with **Tailwind CSS**, **viem** for RPC reads and wallet transactions, and **`@somnia-chain/reactivity`** for **event-driven** protocol updates without polling those events.

---

## Overview

**Liquidation Radar** dashboard for Somnia Testnet (**chain id 50312**): connect a browser wallet, manage collateral and RSC debt, step oracle prices, watch addresses, and see a **live event feed** and **position snapshots** when the Reactivity subscription delivers data.

---

## Key features (implemented)

| Feature | Implementation |
|---------|------------------|
| Wallet connection | `Header` + `WalletContext`: EIP-1193 `eth_requestAccounts`, viem `createWalletClient` + `custom(window.ethereum)` |
| Deposit / mint / redeem / burn | `LendingActionsCard` + `useLendingActions`: approve mock tokens, `depositCollateral`, `depositCollateralAndMintRsc`, `redeemCollateral`, `redeemCollateralForRsc`, `mintRsc`, `burnRsc` via viem |
| Price simulation | `PriceLabCard` + `useStepPrice`: `DemoOracle.stepPrice(token, increase)` (±5%, **2 min** cooldown per wallet) |
| Health factor & position | `PositionCard`: data from **`useProtocolReactivity`** (reactive snapshots) with fallback to **`usePosition`** (HTTP `readContract`) |
| Watched addresses | `WatchAddressCard` + `WatchedAddressesTable`; list persisted in **Zustand** (`localStorage`); rows updated from **reactivity snapshots** |
| Live event feed | `EventFeedCard` — items from **`useProtocolReactivity`** via `appendEventFeedItem` |
| Recent liquidations | `RecentLiquidationsCard` — populated when **`Liquidated`** events appear in the subscription |
| Testnet faucet | `FaucetCard` + `useMint`: **`mintOnInterval`** on mock tokens (interval-gated on-chain) |
| Reactivity status | `ReactivityStatusBar` reads **`reactivityStatus`** from the store (reserved for subscription lifecycle; may stay empty until wired) |

---

## Architecture

```
frontend/liquidatorRadar/
├── src/
│   ├── App.tsx                 # Layout, wires hooks + store
│   ├── components/             # dashboard/*, layout/*, shared/*
│   ├── context/                # WalletContext, ToastContext
│   ├── hooks/                  # usePosition, useLendingActions, useProtocolReactivity, useTokenBalances, …
│   ├── lib/reactivity/         # getSdk (WS client), subscriptions, types, event helpers
│   ├── store/useAppStore.ts    # Zustand (persist: watched addresses)
│   ├── contracts-abi/          # Deployed ABIs + addresses
│   └── data/mockTokens.ts      # Chain + token metadata
├── package.json
└── vite.config.ts
```

- **State**: **Zustand** for token balances, wallet assets, watched rows, event feed, recent liquidations, and connected address. **Initial** position/prices often come from **HTTP** `publicClient.readContract`; **live** HF/debt/collateral for the connected wallet can be **overridden** by **`useProtocolReactivity`** when snapshots arrive.
- **Wallet**: React context holds **`address` only**; signing uses **`window.ethereum`** through viem.

---

## Somnia Reactivity (frontend)

- **`lib/reactivity/client.ts`** — Lazy-loads `@somnia-chain/reactivity` **`SDK`**, ensures **`Buffer`** polyfill, creates a **WebSocket** viem `publicClient` for Somnia Testnet.
- **`lib/reactivity/subscriptions.ts`** — **`subscribeToProtocolEvents(addresses, onUpdate)`**:
  - **`eventContractSources`**: `DemoOracleAddress` + `RSCEngineAddress`
  - **`ethCalls`**: for each tracked address, encodes **`getHealthFactor`** and **`getAccountInformation`** on the engine
  - **`onData`**: decodes logs (`PriceUpdated`, `CollateralDeposited`, `CollateralRedeemed`, `RscMinted`, `RscBurned`, `Liquidated`) and merges **`simulationResults`** into **`PositionSnapshot[]`**
- **`hooks/useProtocolReactivity.ts`** — Subscribes when there is at least one address (connected and/or watched). Updates event feed, watched table, recent liquidations, and **`positionUpdate`** for the connected wallet when a matching snapshot exists.

This design **avoids polling for protocol events**: updates are pushed when matching logs appear, with **atomic-style** reads via the subscription’s **`simulationResults`** (same pattern as the Reactivity API contract).

---

## Contract interaction layer

| Concern | Location |
|---------|----------|
| ABIs + addresses | `src/contracts-abi/*.ts` |
| Lending txs | `useLendingActions.ts` — `publicClient` (HTTP) for gas estimate + receipt wait; `walletClient.writeContract` for sends |
| Oracle price steps | `useStepPrice.ts` |
| Token balances | `useTokenBalances.ts` — HTTP reads of mock ERC20 `balanceOf` |
| Collateral breakdown | `useCollateralBreakdown.ts` |
| Manual position | `usePosition.ts` — `getHealthFactor` + `getAccountInformation` |
| Oracle prices for Price Lab | `useOraclePrices.ts` — used by `PriceLabCard` with `DemoOracle.getPrices` |

All on-chain **reads** in hooks use **viem** `createPublicClient` with **HTTP** transport unless noted; **reactivity** uses **WebSocket** for the SDK.

---

## Syncing with blockchain state

1. **After user actions** (deposit, mint, etc.), hooks call **`refetch`** on position / balances where wired in `App.tsx`.
2. **Reactive path**: when an event matches the subscription, **`simulationResults`** refresh HF and account info for tracked addresses — UI prefers **`reactiveUpdate`** over the last manual **`usePosition`** fetch when present.
3. **Token balances** are refetched on engine position-changing events for the **connected** address (see `useProtocolReactivity` callbacks).

---

## Setup

**Requirements**: Node 18+, **pnpm** or npm, a wallet extension on **Somnia Testnet**.

```bash
cd frontend/liquidatorRadar
pnpm install
pnpm dev
```

Open the printed local URL (default Vite port). Build for production:

```bash
pnpm build
pnpm preview   # optional local preview of dist
```

**Contract addresses** are compiled into `src/contracts-abi/*-abi.ts`. If you redeploy, update those files to match the deployment.

---

## Package name

`package.json` **`name`**: `liquidator-radar`.

---

## See also

- [Root README](../README.md)
- [Contracts README](../contracts/README.md)
- [Bot README](../bot/README.md)
