import SectionCard from "../shared/SectionCard";
import type { PositionData } from "../../hooks/usePosition";
import type { CollateralTokenPosition } from "../../hooks/useCollateralBreakdown";

interface PositionCardProps {
  position: PositionData | null;
  loading?: boolean;
  collateralTokens?: CollateralTokenPosition[];
}

const CIRCUMFERENCE = 2 * Math.PI * 58;

function formatUsd(wei: bigint): string {
  const val = Number(wei) / 1e18;
  return val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function healthStatus(hf: bigint): string {
  const n = Number(hf) / 1e18;
  if (n <= 0) return "Liquidatable";
  if (n < 1) return "High Risk";
  if (n < 1.5) return "Warning";
  return "Safe";
}

function healthColors(hf: bigint) {
  const n = Number(hf) / 1e18;
  if (n <= 0) {
    return {
      ring: "text-rose-500",
      badge: "text-rose-400 bg-rose-500/10",
    };
  }
  if (n < 1) {
    return {
      ring: "text-rose-500",
      badge: "text-rose-400 bg-rose-500/10",
    };
  }
  if (n < 1.5) {
    return {
      ring: "text-amber-400",
      badge: "text-amber-300 bg-amber-500/10",
    };
  }
  return {
    ring: "text-emerald-400",
    badge: "text-emerald-300 bg-emerald-500/10",
  };
}

function gaugePercent(hf: bigint): number {
  const n = Number(hf) / 1e18;
  return Math.min(1, Math.max(0, n / 2));
}

const PositionCard = ({ position, loading = false, collateralTokens = [] }: PositionCardProps) => {
  if (loading) {
    return (
      <SectionCard title="Your Position">
        <p className="text-slate-400 text-sm">Loading position...</p>
      </SectionCard>
    );
  }
  if (!position) {
    return (
      <SectionCard title="Your Position">
        <p className="text-slate-400 text-sm">Connect wallet to see your position.</p>
      </SectionCard>
    );
  }

  const { healthFactor, totalRscMinted, collateralValueInUsd } = position;
  const hfNum = Number(healthFactor) / 1e18;
  const displayHf = Math.min(hfNum, 100); // Cap at 100 when no debt = "safe"
  const colors = healthColors(healthFactor);
  const gp = gaugePercent(healthFactor);
  const dashArray = CIRCUMFERENCE.toFixed(1);
  const dashOffset = (CIRCUMFERENCE * (1 - gp)).toFixed(1);

  return (
    <SectionCard title="Your Position">
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
            <circle
              className="text-brand-border"
              cx="64"
              cy="64"
              r="58"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="8"
            />
            <circle
              className={colors.ring}
              cx="64"
              cy="64"
              r="58"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-brand-cyan">{displayHf.toFixed(2)}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${colors.badge}`}>
              {healthStatus(healthFactor)}
            </span>
          </div>
        </div>
        <div className="flex-1 ml-8 space-y-4">
          <div>
            <p className="text-xs text-slate-400">Collateral (USD)</p>
            <p className="text-xl font-semibold">${formatUsd(collateralValueInUsd)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Debt (RSC)</p>
            <p className="text-xl font-semibold">${formatUsd(totalRscMinted)}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-brand-border pt-4 mt-2">
        <p className="text-xs text-slate-400 mb-2">Deposited collateral</p>
        {collateralTokens.length === 0 ? (
          <p className="text-xs text-slate-500">No collateral deposited yet.</p>
        ) : (
          <div className="space-y-1">
            {collateralTokens.map((t) => (
              <div
                key={t.id}
                className="flex justify-between text-xs text-slate-300"
              >
                <span className="font-mono">{t.symbol}</span>
                <span>
                  {t.amount}{" "}
                  <span className="text-slate-500">
                    (~${t.usd})
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default PositionCard;
