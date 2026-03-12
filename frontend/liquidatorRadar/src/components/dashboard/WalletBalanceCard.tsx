import SectionCard from '../shared/SectionCard';
import type { WalletAsset } from '../../types/dashboard';

interface WalletBalanceCardProps {
  assets: WalletAsset[];
}

const WalletBalanceCard = ({ assets }: WalletBalanceCardProps) => {
  return (
    <SectionCard title="Wallet Balance">
      <ul className="space-y-3">
        {assets.map((asset) => (
          <li
            key={asset.id}
            className={`flex items-center justify-between p-3 rounded-lg bg-brand-dark/50 ${
              asset.isPrimary ? 'border border-brand-cyan/20' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${asset.accentClasses}`}
              >
                {asset.symbol}
              </div>
              <span className="font-medium">{asset.label}</span>
            </div>
            <span
              className={`font-mono ${
                asset.isPrimary ? 'text-brand-cyan' : 'text-slate-200'
              }`}
            >
              {asset.amount}
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
};

export default WalletBalanceCard;

