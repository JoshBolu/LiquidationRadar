import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  addWatchedAddress: (address: string) => void;
  removeWatchedAddress: (id: string) => void;
  setRecentLiquidations: (rows: RecentLiquidation[]) => void;
  appendRecentLiquidation: (item: RecentLiquidation) => void;
  setEventFeedItems: (items: EventFeedItem[]) => void;
  appendEventFeedItem: (item: EventFeedItem) => void;
  updateWatchedRowsFromSnapshots: (snapshots: Array<{
    address: `0x${string}`;
    healthFactor: bigint;
    totalDscMinted: bigint;
    collateralValueInUsd: bigint;
  }>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
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
      addWatchedAddress: (address) =>
        set((s) => {
          const addr = address.trim().toLowerCase();
          if (!addr || s.watchedAddresses.some((r) => r.address.toLowerCase() === addr))
            return s;
          return {
            watchedAddresses: [
              ...s.watchedAddresses,
              {
                id: crypto.randomUUID(),
                address: addr,
                healthFactor: 0,
                collateralUsd: 0,
                debtUsd: 0,
              },
            ],
          };
        }),
      removeWatchedAddress: (id) =>
        set((s) => ({
          watchedAddresses: s.watchedAddresses.filter((r) => r.id !== id),
        })),
      setRecentLiquidations: (recentLiquidations) => set({ recentLiquidations }),
      appendRecentLiquidation: (item) =>
        set((s) => ({
          recentLiquidations: [item, ...s.recentLiquidations].slice(0, 10),
        })),
      setEventFeedItems: (eventFeedItems) => set({ eventFeedItems }),
      appendEventFeedItem: (item) =>
        set((s) => ({
          eventFeedItems: [item, ...s.eventFeedItems].slice(0, 50),
        })),
      updateWatchedRowsFromSnapshots: (snapshots) =>
        set((s) => {
          const byAddr = new Map(
            snapshots.map((snap) => [snap.address.toLowerCase(), snap])
          );
          const next = s.watchedAddresses.map((row) => {
            const snap = byAddr.get(row.address.toLowerCase());
            if (!snap) return row;
            return {
              ...row,
              healthFactor: Number(snap.healthFactor) / 1e18,
              collateralUsd: Number(snap.collateralValueInUsd) / 1e18,
              debtUsd: Number(snap.totalDscMinted) / 1e18,
            };
          });
          return { watchedAddresses: next };
        }),
    }),
    {
      name: "liquidator-radar-store",
      partialize: (state) => ({
        watchedAddresses: state.watchedAddresses,
      }),
    }
  )
);
