import { create } from "zustand";
import type { Address } from "viem";
import type {
  EventFeedItem,
  PositionSummary,
  PriceAsset,
  ReactivityStatus,
  RecentLiquidation,
  TokenBalance,
  WatchedAddressRow,
  WalletAsset,
} from "../types/dashboard";

/**
 * Global app state for live data. Filled by:
 * - Initial HTTP reads
 * - Somnia Reactivity subscriptions (onData → setState)
 * Components read from here; no mock data.
 */
interface AppState {
  // ——— Wallet / tokens (reactivity + initial fetch)
  connectedAddress: Address | null;
  tokenBalances: TokenBalance[];
  walletAssets: WalletAsset[];
  tokensLoading: boolean;
  tokensError: string | null;

  // ——— Position (engine/oracle — reactivity later)
  position: PositionSummary | null;

  // ——— Prices (oracle — reactivity later)
  priceAssets: PriceAsset[];

  // ——— Reactivity status (from subscription lifecycle)
  reactivityStatus: ReactivityStatus | null;

  // ——— Watched addresses / tables (reactivity later)
  watchedAddresses: WatchedAddressRow[];
  recentLiquidations: RecentLiquidation[];
  eventFeedItems: EventFeedItem[];

  // ——— Actions
  setConnectedAddress: (address: Address | null) => void;
  setTokenBalances: (tokens: TokenBalance[]) => void;
  setWalletAssets: (assets: WalletAsset[]) => void;
  setTokensLoading: (loading: boolean) => void;
  setTokensError: (error: string | null) => void;
  setPosition: (position: PositionSummary | null) => void;
  setPriceAssets: (assets: PriceAsset[]) => void;
  setReactivityStatus: (status: ReactivityStatus | null) => void;
  setWatchedAddresses: (rows: WatchedAddressRow[]) => void;
  setRecentLiquidations: (rows: RecentLiquidation[]) => void;
  setEventFeedItems: (items: EventFeedItem[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  connectedAddress: null,
  tokenBalances: [],
  walletAssets: [],
  tokensLoading: false,
  tokensError: null,
  position: null,
  priceAssets: [],
  reactivityStatus: null,
  watchedAddresses: [],
  recentLiquidations: [],
  eventFeedItems: [],

  setConnectedAddress: (address) => set({ connectedAddress: address }),
  setTokenBalances: (tokenBalances) => set({ tokenBalances }),
  setWalletAssets: (walletAssets) => set({ walletAssets }),
  setTokensLoading: (tokensLoading) => set({ tokensLoading }),
  setTokensError: (tokensError) => set({ tokensError }),
  setPosition: (position) => set({ position }),
  setPriceAssets: (priceAssets) => set({ priceAssets }),
  setReactivityStatus: (reactivityStatus) => set({ reactivityStatus }),
  setWatchedAddresses: (watchedAddresses) => set({ watchedAddresses }),
  setRecentLiquidations: (recentLiquidations) => set({ recentLiquidations }),
  setEventFeedItems: (eventFeedItems) => set({ eventFeedItems }),
}));
