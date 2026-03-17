import type { Address } from "viem";

export type RiskLevel =
  | "SAFE"
  | "RISK"
  | "LIQUIDATABLE"
  | "WARNING"
  | "CRITICAL";

export interface TokenBalance {
  id: string;
  address: Address;
  symbol: string;
  balance: string;
  decimals: number;
}

export interface PositionSummary {
  healthFactor: number;
  healthStatusLabel: string;
  collateralUsd: number;
  debtUsd: number;
  gaugePercent: number; // 0–1 for stroke offset
}

export interface WalletAsset {
  id: string;
  symbol: string;
  label: string;
  amount: number | string;
  accentClasses: string;
  isPrimary?: boolean;
}

export interface WatchedAddressRow {
  id: string;
  address: string;
  healthFactor: number;
  collateralUsd: number;
  debtUsd: number;
}

export interface RecentLiquidation {
  id: string;
  address: string;
  collateralUsd: string;
  debtCoveredUsd: string;
  timeLabel: string;
  token?: string;
}

export type EventType = "MINT" | "PRICE_UPDATE" | "LIQUIDATION" | "INFO";

export interface EventFeedItem {
  id: string;
  timestamp: string;
  type: EventType;
  message: string;
}

export interface PriceAsset {
  id: string;
  symbol: string;
  displayName: string;
  priceUsd: number;
}

export interface FaucetAsset {
  id: string;
  symbol: string;
  label: string;
}

export interface ReactivityStatus {
  status: "LIVE" | "PAUSED" | "OFFLINE";
  lastBlock: number;
  mode: string;
  detail: string;
}
