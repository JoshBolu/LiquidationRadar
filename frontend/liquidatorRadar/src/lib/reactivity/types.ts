/**
 * One reactive update delivered when DemoOracle emits PriceUpdated:
 * the event fields plus the bundled RSCEngine view results for the watched address.
 */
export type PriceReactiveUpdate = {
  updater: `0x${string}`;
  token: `0x${string}`;
  oldPrice: bigint;
  newPrice: bigint;
  watchedAddress: `0x${string}`;
  healthFactor: bigint;
  totalDscMinted: bigint;
  collateralValueInUsd: bigint;
};

/**
 * Position snapshot derived from a PriceReactiveUpdate (for Your Position card).
 */
export type PositionSnapshot = {
  healthFactor: bigint;
  totalDscMinted: bigint;
  collateralValueInUsd: bigint;
};
