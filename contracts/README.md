# Liquidation Radar — Smart contracts

Foundry-based Solidity contracts for a minimal **CDP-style** system: users post **mock ERC20 collateral**, mint **RSC** (ReactiveSomniaCoin) through **`RSCEngine`**, and can be **liquidated** when their **health factor** drops below `1e18` (1.0 in 18-decimal fixed form).

---

## Protocol design

- **Exogenous collateral** — Only tokens registered in the engine constructor (see `DeployProject.s.sol`: `MockBtc`, `MockEth`, `MockSomi`).
- **Peg** — RSC is intended to track **\$1** of debt notionally; collateral and debt are valued via **`DemoOracle`** USD prices (8 decimals, Chainlink-style scale).
- **Overcollateralization** — `LIQUIDATION_THRESHOLD = 50` with `LIQUIDATION_PRECISION = 100`: **50%** of collateral value (in USD) counts toward the HF numerator vs. minted RSC (see `RSCEngine._healthFactor`). Comments in `RSCEngine` describe this as a **200%** overcollateralization framing relative to that threshold.

---

## Contracts

### `RSCEngine.sol`

Core logic: collateral ledger, RSC minted per user, oracle reads, HF checks, liquidation.

| Responsibility | Detail |
|----------------|--------|
| Collateral | `mapping(user => token => amount)`; only allowed collateral tokens. |
| Debt | `rscMinted[user]` — RSC amount minted through the engine. |
| Oracle | `IDemoOracle` for `getPrice` / USD valuation. |
| RSC token | `ReactiveSomniaCoin` — engine is owner and mints/burns via `mint` / `burn`. |

**Important external functions**

| Function | Behavior |
|----------|----------|
| `depositCollateral(token, amount)` | Pulls ERC20 from `msg.sender`, credits collateral, emits `CollateralDeposited`. |
| `depositCollateralAndMintRsc(token, amountCollateral, amountRscToMint)` | Deposits then mints in one tx. |
| `mintRsc(amountRscToMint)` | Increases debt, mints RSC to `msg.sender`, checks HF, emits `RscMinted`. |
| `burnRsc(amount)` | Burns RSC from `msg.sender` (transfer to engine then burn), reduces debt, emits `RscBurned`. |
| `redeemCollateral(token, amount)` | Sends collateral to `msg.sender`; **requires HF ≥ 1 after**; emits `CollateralRedeemed`. |
| `redeemCollateralForRsc(token, amountCollateral, amountRscToBurn)` | **Burns RSC first**, then redeems collateral (order matters for HF). |
| `liquidate(collateral, user, debtToCover)` | Only if `_healthFactor(user) < 1e18`; redeems collateral to liquidator (debt-equivalent + **10% bonus**), burns `debtToCover` RSC from liquidator; emits `Liquidated`. Reverts if user HF did not improve or liquidator ends unhealthy. |

**Constants (from source)**

- `MIN_HEALTH_FACTOR = 1e18`
- `LIQUIDATION_THRESHOLD = 50`, `LIQUIDATION_PRECISION = 100`
- `LIQUIDATOR_BONUS = 10` (10% on top of collateral corresponding to covered debt)

**Health factor (internal)**

For non-zero debt:

```text
collateralAdjustedForThreshold = collateralValueInUsd * LIQUIDATION_THRESHOLD / LIQUIDATION_PRECISION
_healthFactor = collateralAdjustedForThreshold * 1e18 / totalRscMinted
```

If `totalRscMinted == 0`, HF is `type(uint256).max`.

**Liquidation (internal)**

1. Require starting HF &lt; `MIN_HEALTH_FACTOR`.
2. `tokenAmountFromDebtCovered = getTokenAmountFromUsd(collateral, debtToCover)`.
3. `bonusCollateral = tokenAmountFromDebtCovered * 10 / 100`.
4. `totalCollateralToRedeem = tokenAmountFromDebtCovered + bonusCollateral`.
5. `_redeemCollateral(user, liquidator, collateral, totalCollateralToRedeem)` then `_burnRsc(debtToCover, user, liquidator)`.
6. Require ending user HF &gt; starting HF; liquidator must remain healthy.

---

### `ReactiveSomniaCoin.sol`

- ERC20 **"ReactiveSomniaCoin" / "RSC"**, `ERC20Burnable` + `Ownable`.
- **`mint`** / **`burn`** are **`onlyOwner`** (the owner is **`RSCEngine`** after deployment transfer).
- Users never mint/burn directly except through engine-exposed flows (`burnRsc` uses `transferFrom` + engine `burn`).

---

### `DemoOracle.sol`

- Owner-controlled **demo** oracle (not production-grade).
- Stores **allowed tokens** and **per-token USD price** (8 decimals, `DECIMALS = 8`).
- **`getPrice` / `getPrices`** — revert if price unset.
- **`setPrice` / `setPrices`** — owner only; each update emits **`PriceUpdated(updater, token, oldPrice, newPrice)`**.
- **`stepPrice(token, increase)`** — public; moves price by **5%** (`STEP_BPS = 500` / 10000); **2 minute** per-address cooldown (`STEP_COOLDOWN`); used by the frontend “Price Lab”.

---

### Mock collateral (`mocks/`)

- **`MockBtc`**, **`MockEth`**, **`MockSomi`** — standard ERC20 + `Ownable`; **`mint(address, uint256)`** for owner; **`mintOnInterval()`** for anyone with a **1-day** interval between mints (amount set in constructor / configurable by owner).
- Used as test collateral and for the in-app faucet pattern (users call `mintOnInterval` on testnet).

---

## Events and reactivity

| Event | Contract | Role |
|-------|----------|------|
| `CollateralDeposited` | `RSCEngine` | User/position activity; bot adds user to tracking set. |
| `CollateralRedeemed` | `RSCEngine` | Withdrawals; frontend subscription decodes for feed + snapshots. |
| `RscMinted` / `RscBurned` | `RSCEngine` | Debt changes; bot tracks mints, prunes on burn when debt hits zero. |
| `Liquidated` | `RSCEngine` | Liquidation feed and recent-liquidations UI. |
| `PriceUpdated` | `DemoOracle` | Price moves; **HF and USD values** change for all positions using that token; bot runs liquidation pass; frontend refreshes collateral valuation context. |

Price updates do **not** mutate balances; they change **oracle outputs**, so **`getAccountCollateralValue`**, **`getHealthFactor`**, and liquidation eligibility all change with the same on-chain state.

---

## Build & test

```bash
cd contracts
forge build
forge test
```

Deploy script: `script/DeployProject.s.sol` — deploys mocks, oracle with initial prices, RSC, engine, then **`rsc.transferOwnership(address(rscEngine))`**.

After redeploying, regenerate or copy ABIs and deployed addresses into **`frontend/liquidatorRadar/src/contracts-abi/`** and **`bot/abi/`** so off-chain code matches chain state.
