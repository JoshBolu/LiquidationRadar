import MainLayout from './components/layout/MainLayout';
import PositionCard from './components/dashboard/PositionCard';
import WalletBalanceCard from './components/dashboard/WalletBalanceCard';
import WatchAddressCard from './components/dashboard/WatchAddressCard';
import ActionTabsCard from './components/dashboard/ActionTabsCard';
import PriceLabCard from './components/dashboard/PriceLabCard';
import FaucetCard from './components/dashboard/FaucetCard';
import WatchedAddressesTable from './components/dashboard/WatchedAddressesTable';
import GlobalBorrowerWatchlist from './components/dashboard/GlobalBorrowerWatchlist';
import ReactivityStatusBar from './components/dashboard/ReactivityStatusBar';
import EventFeedCard from './components/dashboard/EventFeedCard';
import {
  borrowerWatchlist,
  eventFeedItems,
  faucetAssets,
  positionSummary,
  priceAssets,
  reactivityStatus,
  walletAssets,
  watchedAddresses,
} from './data/mockData';

const App = () => {
  return (
    <MainLayout>
      <aside className="col-span-12 lg:col-span-4 space-y-6">
        <PositionCard position={positionSummary} />
        <WalletBalanceCard assets={walletAssets} />
        <WatchAddressCard />
        <ActionTabsCard />
      </aside>

      <div className="col-span-12 lg:col-span-8 space-y-6">
        <PriceLabCard assets={priceAssets} />

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <FaucetCard assets={faucetAssets} />
          <WatchedAddressesTable rows={watchedAddresses} />
          <GlobalBorrowerWatchlist rows={borrowerWatchlist} />
          <ReactivityStatusBar status={reactivityStatus} />
          <EventFeedCard items={eventFeedItems} />
        </div>
      </div>
    </MainLayout>
  );
};

export default App;
