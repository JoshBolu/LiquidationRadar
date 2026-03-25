import SectionCard from "../shared/SectionCard";
import { useOraclePrices } from "../../hooks/useOraclePrices";
import { useStepPrice } from "../../hooks/useStepPrice";

function formatPrice(symbol: string, priceUsd: number): string {
  if (symbol.toLowerCase() === "msomi") {
    return priceUsd.toLocaleString(undefined, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }
  if (priceUsd < 1) {
    return priceUsd.toLocaleString(undefined, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }
  return priceUsd.toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export default function PriceLabCard() {
  const { assets, loading, error, refetch } = useOraclePrices();
  const { stepPrice, pending } = useStepPrice(refetch);

  if (loading && assets.length === 0) {
    return (
      <SectionCard title="Price Lab" subtitle="Live prices from DemoOracle">
        <p className="text-slate-400 text-sm">Loading prices...</p>
      </SectionCard>
    );
  }

  if (error && assets.length === 0) {
    return (
      <SectionCard title="Price Lab" subtitle="Live prices from DemoOracle">
        <p className="text-red-400 text-sm">{error}</p>
      </SectionCard>
    );
  }

  if (assets.length === 0) {
    return (
      <SectionCard title="Price Lab" subtitle="Live prices from DemoOracle">
        <p className="text-slate-400 text-sm">No price data.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Price Lab"
      subtitle="Step prices ±5% on-chain"
    >
      <p className="text-[11px] text-slate-400 mb-3">
        Each wallet can step a token&apos;s price at most once every{" "}
        <span className="font-semibold text-slate-200">2 minutes</span>. If a button seems
        stuck on <span className="font-mono">...</span>, wait for cooldown to finish.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {assets.map((asset) => {
          const isPending = pending === asset.address;
          return (
            <div
              key={asset.id}
              className="p-4 bg-brand-dark rounded-xl border border-brand-border"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-slate-400">
                  {asset.symbol}
                </span>
                <span className="text-lg font-mono font-bold">
                  ${formatPrice(asset.symbol, asset.priceUsd)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => stepPrice(asset.address, true)}
                  disabled={isPending}
                  className="flex items-center justify-center space-x-1 py-2 bg-emerald-500/10 text-emerald-500 rounded text-xs font-bold hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  <span>▲</span> <span>{isPending ? "..." : "+5%"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => stepPrice(asset.address, false)}
                  disabled={isPending}
                  className="flex items-center justify-center space-x-1 py-2 bg-rose-500/10 text-rose-500 rounded text-xs font-bold hover:bg-rose-500/20 disabled:opacity-50"
                >
                  <span>▼</span> <span>{isPending ? "..." : "-5%"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
