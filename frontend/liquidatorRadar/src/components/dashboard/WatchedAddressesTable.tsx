import SectionCard from "../shared/SectionCard";
import { useAppStore } from "../../store/useAppStore";
import type { WatchedAddressRow } from "../../types/dashboard";

interface WatchedAddressesTableProps {
  rows: WatchedAddressRow[];
}

const shortAddr = (addr: string) =>
  addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

const WatchedAddressesTable = ({ rows }: WatchedAddressesTableProps) => {
  const removeWatchedAddress = useAppStore((s) => s.removeWatchedAddress);
  return (
    <SectionCard
      title="Watched Addresses"
      subtitle="Manually tracked addresses (reactivity)"
    >
      <div className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-slate-400 text-sm py-4">No watched addresses yet.</p>
        ) : (
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
                  {shortAddr(row.address)}
                </td>
                <td className="px-4 py-4 font-bold text-emerald-400">
                  {Math.min(row.healthFactor, 100).toFixed(2)}
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
                    onClick={() => removeWatchedAddress(row.id)}
                    className="text-rose-500 hover:text-rose-400"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </SectionCard>
  );
};

export default WatchedAddressesTable;

