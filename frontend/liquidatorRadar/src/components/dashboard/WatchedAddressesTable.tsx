import SectionCard from '../shared/SectionCard';
import type { WatchedAddressRow } from '../../types/dashboard';

interface WatchedAddressesTableProps {
  rows: WatchedAddressRow[];
}

const WatchedAddressesTable = ({ rows }: WatchedAddressesTableProps) => {
  return (
    <SectionCard
      title="Watched Addresses"
      subtitle="Manually tracked addresses added by you"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-400 uppercase bg-brand-dark/50 border-y border-brand-border">
            <tr>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Health Factor</th>
              <th className="px-4 py-3">Collateral</th>
              <th className="px-4 py-3">Debt</th>
              <th className="px-4 py-3 text-right">Delete</th>
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
                <td className="px-4 py-4 font-bold text-emerald-400">
                  {row.healthFactor.toFixed(2)}
                </td>
                <td className="px-4 py-4">
                  ${row.collateralUsd.toLocaleString()}
                </td>
                <td className="px-4 py-4">
                  ${row.debtUsd.toLocaleString()}
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    type="button"
                    className="text-rose-500 hover:text-rose-400"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
};

export default WatchedAddressesTable;

