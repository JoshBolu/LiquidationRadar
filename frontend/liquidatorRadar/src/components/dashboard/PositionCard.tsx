import SectionCard from '../shared/SectionCard';
import type { PositionSummary } from '../../types/dashboard';

interface PositionCardProps {
  position: PositionSummary;
}

const CIRCUMFERENCE = 2 * Math.PI * 58;

const PositionCard = ({ position }: PositionCardProps) => {
  const { healthFactor, healthStatusLabel, collateralUsd, debtUsd, gaugePercent } =
    position;

  const dashArray = CIRCUMFERENCE.toFixed(1);
  const dashOffset = (CIRCUMFERENCE * (1 - gaugePercent)).toFixed(1);

  return (
    <SectionCard title="Your Position">
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 128 128"
          >
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
              className="text-brand-cyan"
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
            <span className="text-2xl font-bold text-brand-cyan">
              {healthFactor.toFixed(2)}
            </span>
            <span className="text-[10px] text-brand-cyan/80 bg-brand-cyan/10 px-2 py-0.5 rounded uppercase">
              {healthStatusLabel}
            </span>
          </div>
        </div>
        <div className="flex-1 ml-8 space-y-4">
          <div>
            <p className="text-xs text-slate-400">Collateral</p>
            <p className="text-xl font-semibold">
              $
              {collateralUsd.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Debt</p>
            <p className="text-xl font-semibold">
              $
              {debtUsd.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export default PositionCard;

