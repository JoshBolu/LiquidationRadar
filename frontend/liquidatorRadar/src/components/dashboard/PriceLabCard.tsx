import { useState } from 'react';
import SectionCard from '../shared/SectionCard';
import type { PriceAsset } from '../../types/dashboard';

interface PriceLabCardProps {
  assets: PriceAsset[];
}

const PriceLabCard = ({ assets }: PriceLabCardProps) => {
  const [prices, setPrices] = useState<Record<string, number>>(
    () =>
      assets.reduce(
        (acc, asset) => ({ ...acc, [asset.id]: asset.priceUsd }),
        {} as Record<string, number>,
      ),
  );

  const adjustPrice = (id: string, deltaPercent: number) => {
    setPrices((prev) => {
      const current = prev[id];
      const next = current * (1 + deltaPercent / 100);
      return { ...prev, [id]: Number(next.toFixed(2)) };
    });
  };

  return (
    <SectionCard
      title="Price Lab Simulation"
      subtitle="Price changes in fixed 5% increments"
      headerRight={
        <button
          type="button"
          className="text-[10px] font-bold tracking-tighter text-brand-cyan border border-brand-cyan px-2 py-1 rounded hover:bg-brand-cyan/10 uppercase"
        >
          Update Prices
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="p-4 bg-brand-dark rounded-xl border border-brand-border"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-slate-400">
                {asset.displayName}
              </span>
              <span className="text-lg font-mono font-bold">
                ${prices[asset.id].toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => adjustPrice(asset.id, 5)}
                className="flex items-center justify-center space-x-1 py-2 bg-emerald-500/10 text-emerald-500 rounded text-xs font-bold hover:bg-emerald-500/20"
              >
                <span>▲</span> <span>+5%</span>
              </button>
              <button
                type="button"
                onClick={() => adjustPrice(asset.id, -5)}
                className="flex items-center justify-center space-x-1 py-2 bg-rose-500/10 text-rose-500 rounded text-xs font-bold hover:bg-rose-500/20"
              >
                <span>▼</span> <span>-5%</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default PriceLabCard;

