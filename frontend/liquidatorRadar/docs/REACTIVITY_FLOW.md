# Reactivity + React + Zustand flow

## Overview

- **Somnia Reactivity SDK**: WebSocket subscription to chain events; when an event matches, the node runs our `ethCalls` and pushes `simulationResults` in one payload.
- **Zustand**: Single source of truth for live data. Subscriptions write here; components read here.
- **React**: `useState` is used for local UI state (e.g. loading, form inputs). Global live data lives in Zustand and triggers re-renders when it changes.

## Data flow

```
Chain event (e.g. Transfer)
    → Somnia Reactivity (sdk.subscribe onData)
    → decode simulationResults
    → useAppStore.getState().setTokenBalances(...)  (and setWalletAssets)
    → Components that use useAppStore(s => s.tokenBalances) re-render
```

No polling. Initial load is one HTTP fetch; after that, updates are push-based via the SDK.

## Where things live

| What | Where | Updated by |
|------|--------|------------|
| Connected address | Zustand `connectedAddress` | WalletContext (sync in App useEffect) |
| Token balances | Zustand `tokenBalances`, `walletAssets` | `useTokenBalances`: initial HTTP + reactivity `onData` |
| Position (engine) | Zustand `position` | (Future) reactivity or HTTP |
| Prices | Zustand `priceAssets` | (Future) reactivity |
| Reactivity status | Zustand `reactivityStatus` | (Future) subscription lifecycle |
| Watched addresses / events / liquidations | Zustand | (Future) reactivity |

## Pattern for a new reactive feed

1. **Store**: Add slice and setter in `src/store/useAppStore.ts` (e.g. `priceAssets`, `setPriceAssets`).
2. **Subscribe**: In a hook or provider, call `getReactivitySDK()` then `sdk.subscribe({ eventContractSources, topicOverrides, ethCalls, onData })`.
3. **onData**: Decode `result.simulationResults` and call the store setter (e.g. `setPriceAssets(...)`).
4. **UI**: Component uses `useAppStore(s => s.priceAssets)` and renders; no local state for the live list.

## Local state (useState) vs store (Zustand)

- **Zustand**: Data that comes from the chain (or will), is shared across components, and is updated by reactivity or initial fetch. Examples: tokenBalances, position, priceAssets.
- **useState**: Local to one component, UI-only (loading, error, form values, modals). Example: `tokensLoading` could stay in hook state but we keep it in the store so any component can show loading; alternatively loading can stay in the hook and only the list in the store.

Current choice: token balances, wallet assets, loading, and error for tokens all live in the store so the whole app can react. Other slices (position, prices, etc.) are store-shaped and ready for reactivity later.
