# Somnia Reactivity – Read Architecture

We use **Somnia Reactivity** for **event-driven reads**: instead of polling, the chain pushes updates when relevant events happen. This doc describes how reactivity works and how we structure the frontend around it.

---

## 1. How Somnia Reactivity Works

### Off-chain (TypeScript / WebSocket)

- You open a **WebSocket** connection to Somnia Testnet (required; HTTP-only clients cannot subscribe).
- You call **`sdk.subscribe(initParams)`** with:
  - **`eventContractSources`**: Contract addresses that emit events we care about (e.g. our 3 mock tokens).
  - **`topicOverrides`**: Event topic filters (e.g. ERC20 `Transfer`).
  - **`ethCalls`**: A fixed list of **view calls** (e.g. `balanceOf(user)` for each token). Each call is encoded as `{ to, data }` (no `from` needed for view).
  - **`onData`**: Callback that receives **event log + results of those view calls** in one payload.
  - **`onlyPushChanges`**: If `true`, we only get a push when the **return data of `ethCalls` changes** (e.g. balance actually changed). Cuts noise and re-renders.

When a matching event is emitted (e.g. `Transfer` on one of the tokens), the node:

1. Runs our `ethCalls` in the same block (post-event state).
2. Pushes one notification: **event topics + data + `simulationResults`** (array of hex return data, one per `ethCall`, in order).

We **decode `simulationResults`** with viem (e.g. `decodeFunctionResult`) and update React state. No polling.

### Important constraints

- **WebSocket required**: The SDK checks `publicClient.transport.type === 'webSocket'` and throws otherwise. So we need a **reactivity client** that uses `transport: webSocket(wssUrl)` for subscriptions.
- **Same chain**: Use Somnia Testnet (chainId 50312) for both HTTP (writes, one-off reads) and WebSocket (reactivity).
- Reactivity is **testnet-only** for now.

---

## 2. Client Split

| Purpose              | Transport | Use case |
|----------------------|-----------|----------|
| **HTTP public**      | `http(rpcUrl)` | One-off reads (initial load, symbol/decimals), and any read when we don’t need reactivity yet. |
| **WebSocket public** | `webSocket(wssUrl)` | **Only** for `SDK.subscribe()`. Must be the same chain. |
| **Wallet**           | `custom(window.ethereum)` | Writes (mint, approve, etc.) and user signing. |

We do **not** use the WebSocket client for normal `readContract` in the UI; we use it only for the reactivity subscription. Initial fetch and fallback stay on HTTP.

---

## 3. Data Flow (Token Balances Example)

1. **User connects**  
   We have `userAddress`.

2. **Initial load (HTTP)**  
   One-off read for each token: `symbol()`, `decimals()`, `balanceOf(userAddress)`.  
   Show balances immediately.

3. **Subscribe (WebSocket + SDK)**  
   - `eventContractSources`: `[MockBtc, MockEth, MockSomi]`.  
   - `topicOverrides`: `[transferTopic]` (ERC20 `Transfer(address,address,uint256)`).  
   - `ethCalls`: for each token, `encodeFunctionData(MockTokensAbi, 'balanceOf', [userAddress])` → `{ to: tokenAddress, data }`.  
   - `onData`: decode `result.simulationResults` (3 u256s), map to token ids, update `tokens` state.  
   - `onlyPushChanges: true`.

4. **On event**  
   Any `Transfer` from any of the three contracts triggers the subscription; we get new balances and re-render.

5. **Cleanup**  
   On disconnect or unmount: call `subscription.unsubscribe()`.

Same pattern applies later to **oracle prices**, **engine state** (health factor, collateral, debt): define which events trigger a refresh, which `ethCalls` to run, and decode `simulationResults` into app state.

---

## 4. Where This Lives in the App

- **Config**: `data/mockTokens.ts` (and similar) – chain with `rpcUrls.default.webSocket`, token addresses, ABIs.
- **Reactivity client**: One place that creates the WebSocket public client and `new SDK({ public: thatClient })`. Used only for `subscribe()`.
- **Hooks**:  
  - Initial fetch: existing HTTP `readContract` (or a small helper).  
  - Subscription: e.g. `useReactiveTokenBalances(address)` that (a) runs initial fetch, (b) subscribes with the SDK when `address` is set, (c) onData → decode → setState, (d) unsubscribe on cleanup/address change.
- **UI**: Unchanged; hooks expose `tokens`, `loading`, `error`. Whether data came from HTTP or from a reactivity push is an implementation detail.

---

## 5. Event → Read Mapping (Planned)

| Source / data        | Trigger events              | ethCalls (concept)                    |
|----------------------|-----------------------------|----------------------------------------|
| Token balances       | `Transfer` on mock tokens   | `balanceOf(user)` per token           |
| Oracle prices        | Price update / round events| `getPrice(token)` or similar          |
| User position / engine | Deposits, borrows, liquidations | Engine/oracle view calls for that user |

We’ll add these subscriptions as we add each feature; the pattern is always: **event sources + topic filter + ethCalls + decode simulationResults**.

---

## 6. Summary

- **Reads that must stay in sync with chain events** → Somnia Reactivity (WebSocket + `sdk.subscribe` with `ethCalls` + `onData`).
- **One-off or initial reads** → HTTP public client.
- **Writes** → Wallet client (existing).
- Architecture: one reactivity client (WebSocket), clear split of responsibilities, and hooks that do “initial HTTP + reactive subscription” so the rest of the app stays simple and testable.
