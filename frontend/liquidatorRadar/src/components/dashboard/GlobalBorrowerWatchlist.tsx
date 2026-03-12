import SectionCard from '../shared/SectionCard';
import StatusBadge, { riskLevelToVariant } from '../shared/StatusBadge';
import type { BorrowerRow } from '../../types/dashboard';

interface GlobalBorrowerWatchlistProps {
  rows: BorrowerRow[];
}

const GlobalBorrowerWatchlist = ({ rows }: GlobalBorrowerWatchlistProps) => {
  return (
    <section className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
      <div className="p-5 border-b border-brand-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">
            Global Borrower Watchlist
          </h2>
          <p className="text-xs text-slate-400">
            Protocol-wide borrowers detected from active RSC minters
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-brand-cyan/10 px-3 py-1.5 rounded-full border border-brand-cyan/20">
          <span className="flex h-2 w-2 rounded-full bg-brand-cyan animate-pulse" />
          <span className="text-[10px] font-bold text-brand-cyan tracking-wider">
            AUTO-LIQUIDATION ACTIVE
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-400 uppercase bg-brand-dark/50 border-b border-brand-border">
            <tr>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Health Factor</th>
              <th className="px-4 py-3">Collateral</th>
              <th className="px-4 py-3">Debt</th>
              <th className="px-4 py-3">Risk Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rows.map((row) => {
              const isCritical = row.riskLevel === 'CRITICAL';
              return (
                <tr
                  key={row.id}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    isCritical ? 'bg-rose-900/10' : ''
                  }`}
                >
                  <td className="px-4 py-4 font-mono text-slate-400">
                    {row.address}
                  </td>
                  <td
                    className={`px-4 py-4 font-bold ${
                      row.riskLevel === 'SAFE'
                        ? 'text-emerald-500'
                        : row.riskLevel === 'WARNING'
                        ? 'text-amber-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {row.healthFactor.toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    ${row.collateralUsd.toLocaleString()}
                  </td>
                  <td className="px-4 py-4">
                    ${row.debtUsd.toLocaleString()}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      label={row.riskLevel}
                      variant={riskLevelToVariant(row.riskLevel)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default GlobalBorrowerWatchlist;

