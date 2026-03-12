import type {
  BorrowerRow,
  EventFeedItem,
  FaucetAsset,
  PositionSummary,
  PriceAsset,
  ReactivityStatus,
  WalletAsset,
  WatchedAddressRow,
} from '../types/dashboard';

export const positionSummary: PositionSummary = {
  healthFactor: 1.85,
  healthStatusLabel: 'Safe',
  collateralUsd: 12500,
  debtUsd: 6750,
  gaugePercent: 0.73,
};

export const walletAssets: WalletAsset[] = [
  {
    id: 'mock-eth',
    symbol: 'Ξ',
    label: 'MOCK-ETH',
    amount: 12.45,
    accentClasses: 'bg-blue-500/20 text-blue-400',
  },
  {
    id: 'mock-btc',
    symbol: '₿',
    label: 'MOCK-BTC',
    amount: 0.85,
    accentClasses: 'bg-orange-500/20 text-orange-400',
  },
  {
    id: 'mock-sol',
    symbol: 'S',
    label: 'MOCK-SOL',
    amount: 142,
    accentClasses: 'bg-purple-500/20 text-purple-400',
  },
  {
    id: 'rsc',
    symbol: 'R',
    label: 'RSC',
    amount: '15,000.00',
    accentClasses: 'bg-brand-cyan/20 text-brand-cyan',
    isPrimary: true,
  },
];

export const priceAssets: PriceAsset[] = [
  {
    id: 'eth',
    symbol: 'ETH',
    displayName: 'ETH',
    priceUsd: 2450,
  },
  {
    id: 'btc',
    symbol: 'BTC',
    displayName: 'BTC',
    priceUsd: 64200,
  },
  {
    id: 'sol',
    symbol: 'SOL',
    displayName: 'SOL',
    priceUsd: 142.1,
  },
];

export const faucetAssets: FaucetAsset[] = [
  { id: 'mock-eth', symbol: 'MOCK-ETH', label: 'MOCK-ETH' },
  { id: 'mock-btc', symbol: 'MOCK-BTC', label: 'MOCK-BTC' },
  { id: 'mock-sol', symbol: 'MOCK-SOL', label: 'MOCK-SOL' },
];

export const watchedAddresses: WatchedAddressRow[] = [
  {
    id: '1',
    address: '0x8a12...f321',
    healthFactor: 2.14,
    collateralUsd: 42000,
    debtUsd: 15200,
  },
  {
    id: '2',
    address: '0x2b45...c112',
    healthFactor: 1.22,
    collateralUsd: 5400,
    debtUsd: 3800,
  },
];

export const borrowerWatchlist: BorrowerRow[] = [
  {
    id: '1',
    address: '0xf1e8...d92a',
    healthFactor: 0.98,
    collateralUsd: 102000,
    debtUsd: 98500,
    riskLevel: 'CRITICAL',
  },
  {
    id: '2',
    address: '0xc921...a11c',
    healthFactor: 1.05,
    collateralUsd: 18400,
    debtUsd: 14200,
    riskLevel: 'WARNING',
  },
  {
    id: '3',
    address: '0x34d5...44e3',
    healthFactor: 4.52,
    collateralUsd: 4500,
    debtUsd: 850,
    riskLevel: 'SAFE',
  },
];

export const eventFeedItems: EventFeedItem[] = [
  {
    id: '1',
    timestamp: '14:22:01',
    type: 'MINT',
    message: 'New Mint Event detected for 0x71C...392A: 3,500 RSC',
  },
  {
    id: '2',
    timestamp: '14:21:45',
    type: 'PRICE_UPDATE',
    message: 'Price Update: MOCK-ETH moved from $2,420 to $2,450 (+1.2%)',
  },
  {
    id: '3',
    timestamp: '14:20:12',
    type: 'LIQUIDATION',
    message:
      'LIQUIDATION: 0x9a82...e321 successfully liquidated for 12.4 ETH collateral.',
  },
  {
    id: '4',
    timestamp: '14:18:55',
    type: 'INFO',
    message: 'Watcher initialized for address: 0x8a12...f321',
  },
];

export const reactivityStatus: ReactivityStatus = {
  status: 'LIVE',
  lastBlock: 12405,
  mode: 'EVENT-DRIVEN',
  detail: 'Syncing via Somnia L1 RPC...',
};

