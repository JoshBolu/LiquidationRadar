import type { ProtocolReactiveUpdate } from "./types";
import {
  MockBtcAddress,
  MockEthAddress,
  MockSomiAddress,
} from "../../contracts-abi/MockTokens-abi";

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function tokenLabel(token: string): string {
  const t = token.toLowerCase();
  if (t === MockEthAddress.toLowerCase()) return "mETH";
  if (t === MockBtcAddress.toLowerCase()) return "mBTC";
  if (t === MockSomiAddress.toLowerCase()) return "mSOMI";
  return shortAddr(token);
}

function fmtUsd(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(4);
}

// DemoOracle stores prices with 8 decimals (1e8), e.g. 2000 * 1e8 = $2,000.00
function fmtOraclePrice(price: bigint): string {
  return (Number(price) / 1e8).toFixed(4);
}

// Collateral amounts use 18 decimals; show more precision for tokens like mBTC/mETH.
function fmtTokenAmount(amount: bigint): string {
  return (Number(amount) / 1e18).toFixed(4);
}

export function toEventFeedItem(update: ProtocolReactiveUpdate): {
  id: string;
  timestamp: string;
  type: "MINT" | "PRICE_UPDATE" | "LIQUIDATION" | "INFO";
  message: string;
} {
  const ts = new Date().toLocaleTimeString();
  const id = `${update.event}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  switch (update.event) {
    case "PriceUpdated":
      return {
        id,
        timestamp: ts,
        type: "PRICE_UPDATE",
        message: `Oracle: token ${tokenLabel(update.token)} $${fmtOraclePrice(
          update.oldPrice,
        )} → $${fmtOraclePrice(update.newPrice)}`,
      };
    case "CollateralDeposited":
      return {
        id,
        timestamp: ts,
        type: "INFO",
        message: `${shortAddr(update.user)} deposited ${fmtTokenAmount(update.amount)} collateral`,
      };
    case "CollateralRedeemed":
      return {
        id,
        timestamp: ts,
        type: "INFO",
        message: `${shortAddr(update.redeemedFrom)} redeemed ${fmtTokenAmount(update.amount)} collateral`,
      };
    case "RscMinted":
      return {
        id,
        timestamp: ts,
        type: "MINT",
        message: `${shortAddr(update.user)} minted $${fmtUsd(update.amount)} RSC`,
      };
    case "RscBurned":
      return {
        id,
        timestamp: ts,
        type: "INFO",
        message: `${shortAddr(update.user)} burned $${fmtUsd(update.amount)} RSC`,
      };
    case "Liquidated":
      return {
        id,
        timestamp: ts,
        type: "LIQUIDATION",
        message: `${shortAddr(update.liquidator)} liquidated ${shortAddr(update.user)} (${tokenLabel(update.collateral)}) — debt: RSC ${fmtUsd(update.debtCovered)}, seized: ${fmtUsd(update.collateralSeized)}`,
      };
    default:
      return { id, timestamp: ts, type: "INFO", message: "Protocol event" };
  }
}
