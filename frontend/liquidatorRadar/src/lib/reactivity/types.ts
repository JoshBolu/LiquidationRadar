import type { Address } from "viem";

/** Position snapshot for a single address (from bundled ethCalls). */
export type PositionSnapshot = {
  address: Address;
  healthFactor: bigint;
  totalRscMinted: bigint;
  collateralValueInUsd: bigint;
};

/** Payload when DemoOracle emits PriceUpdated. */
export type PriceReactiveUpdate = {
  event: "PriceUpdated";
  updater: Address;
  token: Address;
  oldPrice: bigint;
  newPrice: bigint;
  snapshots: PositionSnapshot[];
};

/** Affected user from an engine event. */
export type EngineEventBase = {
  user: Address;
  snapshots: PositionSnapshot[];
};

export type CollateralDepositedUpdate = EngineEventBase & {
  event: "CollateralDeposited";
  token: Address;
  amount: bigint;
};

export type CollateralRedeemedUpdate = EngineEventBase & {
  event: "CollateralRedeemed";
  redeemedFrom: Address;
  redeemedTo: Address;
  token: Address;
  amount: bigint;
};

export type RscMintedUpdate = EngineEventBase & {
  event: "RscMinted";
  amount: bigint;
};

export type RscBurnedUpdate = EngineEventBase & {
  event: "RscBurned";
  amount: bigint;
};

export type LiquidatedUpdate = EngineEventBase & {
  event: "Liquidated";
  liquidator: Address;
  collateral: Address;
  debtCovered: bigint;
  collateralSeized: bigint;
};

export type ProtocolReactiveUpdate =
  | PriceReactiveUpdate
  | CollateralDepositedUpdate
  | CollateralRedeemedUpdate
  | RscMintedUpdate
  | RscBurnedUpdate
  | LiquidatedUpdate;
