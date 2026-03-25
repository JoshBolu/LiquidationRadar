import { useEffect, useRef, useState } from "react";
import { subscribeToProtocolEvents } from "../lib/reactivity/subscriptions";
import type { ProtocolReactiveUpdate } from "../lib/reactivity/types";
import { toEventFeedItem } from "../lib/reactivity/eventFeedHelpers";
import { useAppStore } from "../store/useAppStore";
import type { Address } from "viem";

/**
 * Single reactive hook for protocol events (DemoOracle + RSCEngine).
 * Subscribes to PriceUpdated, CollateralDeposited, CollateralRedeemed, RscMinted, RscBurned, Liquidated.
 * Pushes updates to store (event feed, liquidations, watched rows) and returns position snapshot for connected wallet.
 */
export function useProtocolReactivity(
  connectedAddress: Address | null,
  watchedAddresses: { id: string; address: string }[],
  onWalletBalancesChange?: () => void,
  onCollateralChange?: () => void
) {
  const [positionUpdate, setPositionUpdate] = useState<{
    healthFactor: bigint;
    totalRscMinted: bigint;
    collateralValueInUsd: bigint;
  } | null>(null);

  const appendEventFeedItem = useAppStore((s) => s.appendEventFeedItem);
  const appendRecentLiquidation = useAppStore((s) => s.appendRecentLiquidation);
  const updateWatchedRowsFromSnapshots = useAppStore(
    (s) => s.updateWatchedRowsFromSnapshots
  );

  const subRef = useRef<{ unsubscribe: () => Promise<unknown> } | null>(null);

  const addresses = [
    ...(connectedAddress ? [connectedAddress] : []),
    ...watchedAddresses
      .map((r) => {
        let a = r.address.trim();
        if (a && !a.startsWith("0x")) a = `0x${a}`;
        return a as Address;
      })
      .filter((a) => a && a.length === 42),
  ];

  useEffect(() => {
    if (addresses.length === 0) {
      setPositionUpdate(null);
      return;
    }

    let cancelled = false;
    const unique = [...new Set(addresses)] as `0x${string}`[];

    subscribeToProtocolEvents(unique, (update: ProtocolReactiveUpdate) => {
      if (cancelled) return;

      appendEventFeedItem(toEventFeedItem(update));

      if (update.snapshots.length > 0) {
        updateWatchedRowsFromSnapshots(update.snapshots);
      }

      if (update.event === "Liquidated") {
        appendRecentLiquidation({
          id: `liq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          address: update.user,
          token: update.collateral,
          collateralUsd: (Number(update.collateralSeized) / 1e18).toFixed(4),
          debtCoveredUsd: (Number(update.debtCovered) / 1e18).toFixed(4),
          timeLabel: new Date().toLocaleTimeString(),
        });
      }

      // Trigger wallet balance refresh for the connected user on position-changing engine events
      if (
        connectedAddress &&
        ["CollateralDeposited", "CollateralRedeemed", "RscMinted", "RscBurned"].includes(
          update.event
        ) &&
        "user" in update &&
        (update.user as string).toLowerCase() === connectedAddress.toLowerCase()
      ) {
        onWalletBalancesChange?.();
        onCollateralChange?.();
      }

      // Price updates affect USD valuation; refresh collateral breakdown for connected user
      if (connectedAddress && update.event === "PriceUpdated") {
        onCollateralChange?.();
      }

      if (connectedAddress) {
        const snap = update.snapshots.find(
          (s) => (s.address as string).toLowerCase() === connectedAddress.toLowerCase()
        );
        if (snap) {
          setPositionUpdate({
            healthFactor: snap.healthFactor,
            totalRscMinted: snap.totalRscMinted,
            collateralValueInUsd: snap.collateralValueInUsd,
          });
        }
      }
    }).then((sub) => {
      if (cancelled) {
        (sub as { unsubscribe?: () => Promise<unknown> })?.unsubscribe?.();
        return;
      }
      if (sub instanceof Error) return;
      subRef.current = sub;
    });

    return () => {
      cancelled = true;
      const s = subRef.current;
      subRef.current = null;
      s?.unsubscribe().catch(() => {});
    };
  }, [
    connectedAddress,
    // resubscribe only when the set of tracked addresses changes
    watchedAddresses.map((w) => w.address.toLowerCase()).join(","),
    onWalletBalancesChange,
    onCollateralChange,
    appendEventFeedItem,
    appendRecentLiquidation,
    updateWatchedRowsFromSnapshots,
  ]);

  return { positionUpdate };
}
