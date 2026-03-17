import MainLayout from "./components/layout/MainLayout";
import PositionCard from "./components/dashboard/PositionCard";
import WalletBalanceCard from "./components/dashboard/WalletBalanceCard";
import WatchAddressCard from "./components/dashboard/WatchAddressCard";
import LendingActionsCard from "./components/dashboard/LendingActionsCard";
import PriceLabCard from "./components/dashboard/PriceLabCard";
import FaucetCard from "./components/dashboard/FaucetCard";
import WatchedAddressesTable from "./components/dashboard/WatchedAddressesTable";
import RecentLiquidationsCard from "./components/dashboard/RecentLiquidationsCard";
import ReactivityStatusBar from "./components/dashboard/ReactivityStatusBar";
import EventFeedCard from "./components/dashboard/EventFeedCard";
import { WalletProvider, useWallet } from "./context/WalletContext";
import { ToastProvider } from "./context/ToastContext";
import Toaster from "./components/shared/Toaster";
import { useTokenBalances } from "./hooks/useTokenBalances";
import { useMint } from "./hooks/useMint";
import { usePosition } from "./hooks/usePosition";
import { useProtocolReactivity } from "./hooks/useProtocolReactivity";
import { useAppStore } from "./store/useAppStore";
import { useEffect, useMemo } from "react";

const AppContent = () => {
  const { address } = useWallet();
  const setConnectedAddress = useAppStore((s) => s.setConnectedAddress);
  const walletAssets = useAppStore((s) => s.walletAssets);
  const tokensLoading = useAppStore((s) => s.tokensLoading);
  const reactivityStatus = useAppStore((s) => s.reactivityStatus);
  const recentLiquidations = useAppStore((s) => s.recentLiquidations);
  const eventFeedItems = useAppStore((s) => s.eventFeedItems);
  const tokenBalances = useAppStore((s) => s.tokenBalances);

  const { refetch: refetchTokenBalances } = useTokenBalances(address);
  const { mint, pendingToken } = useMint(address, refetchTokenBalances);
  const watchedAddresses = useAppStore((s) => s.watchedAddresses);
  const { position: manualPosition, loading: positionLoading, refetch: refetchPosition } = usePosition(address);
  const { positionUpdate: reactiveUpdate } = useProtocolReactivity(
    address ?? null,
    watchedAddresses,
    refetchTokenBalances
  );

  useEffect(() => {
    setConnectedAddress(address ?? null);
  }, [address, setConnectedAddress]);

  const displayPosition = useMemo(() => {
    if (reactiveUpdate) {
      return {
        healthFactor: reactiveUpdate.healthFactor,
        totalDscMinted: reactiveUpdate.totalDscMinted,
        collateralValueInUsd: reactiveUpdate.collateralValueInUsd,
      };
    }
    return manualPosition;
  }, [reactiveUpdate, manualPosition]);

  return (
    <MainLayout>
      <Toaster />
      <aside className="col-span-12 lg:col-span-4 space-y-6">
        <PositionCard
          position={displayPosition}
          loading={positionLoading && !reactiveUpdate}
        />
        <WalletBalanceCard assets={walletAssets} loading={tokensLoading} />
        <WatchAddressCard />
        <LendingActionsCard userAddress={address} onSuccess={refetchPosition} />
      </aside>

      <div className="col-span-12 lg:col-span-8 space-y-6">
        <PriceLabCard />

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <FaucetCard
            tokens={tokenBalances}
            mint={mint}
            pendingToken={pendingToken}
          />
          <WatchedAddressesTable rows={watchedAddresses} />
          <RecentLiquidationsCard rows={recentLiquidations} />
          <ReactivityStatusBar status={reactivityStatus} />
          <EventFeedCard items={eventFeedItems} />
        </div>
      </div>
    </MainLayout>
  );
};

const App = () => (
  <ToastProvider>
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  </ToastProvider>
);

export default App;
