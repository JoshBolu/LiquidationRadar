import SectionCard from '../shared/SectionCard';
import type { RecentLiquidation } from '../../types/dashboard';

interface RecentLiquidationsCardProps {
  rows: RecentLiquidation[];
}

const RecentLiquidationsCard = ({ rows }: RecentLiquidationsCardProps) => {
  return (
    <SectionCard
      title="Recently Liquidated Accounts"
      subtitle="Latest liquidations (reactivity)"
    >
      <div className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-slate-400 text-sm py-4">No liquidations yet.</p>
        ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-400 uppercase bg-brand-dark/50 border-y border-brand-border">
            <tr>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Collateral</th>
              <th className="px-4 py-3">Debt Covered</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-4 py-4 font-mono text-slate-400">
                  {row.address}
                </td>
                <td className="px-4 py-4">{row.collateralUsd}</td>
                <td className="px-4 py-4">{row.debtCoveredUsd}</td>
                <td className="px-4 py-4 text-slate-400">{row.timeLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </SectionCard>
  );
};

export default RecentLiquidationsCard;
