import SectionCard from '../shared/SectionCard';
import type { FaucetAsset } from '../../types/dashboard';

interface FaucetCardProps {
  assets: FaucetAsset[];
}

const FaucetCard = ({ assets }: FaucetCardProps) => {
  return (
    <SectionCard title="Faucet">
      <div className="flex flex-wrap gap-4">
        {assets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            className="flex-1 min-w-[140px] px-4 py-3 bg-brand-dark border border-brand-border rounded-lg text-sm font-semibold hover:border-brand-cyan transition-colors flex items-center justify-between"
          >
            <span>{asset.label}</span>
            <span className="text-brand-cyan">Mint</span>
          </button>
        ))}
      </div>
    </SectionCard>
  );
};

export default FaucetCard;

