import { useState } from 'react';

type ActionTab = 'DEPOSIT' | 'MINT' | 'REDEEM';

const tabs: { id: ActionTab; label: string }[] = [
  { id: 'DEPOSIT', label: 'Deposit' },
  { id: 'MINT', label: 'Mint RSC' },
  { id: 'REDEEM', label: 'Redeem' },
];

const ActionTabsCard = () => {
  const [activeTab, setActiveTab] = useState<ActionTab>('MINT');

  const renderContentLabel = () => {
    switch (activeTab) {
      case 'DEPOSIT':
        return 'Collateral Amount (ETH)';
      case 'MINT':
        return 'Collateral Amount (ETH)';
      case 'REDEEM':
        return 'Collateral to Redeem (ETH)';
      default:
        return 'Collateral Amount (ETH)';
    }
  };

  return (
    <section className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
      <div className="flex border-b border-brand-border bg-brand-dark/30">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-brand-cyan text-brand-cyan bg-brand-cyan/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="p-5 space-y-4">
        <div>
          <label className="text-xs text-slate-400 block mb-2">
            {renderContentLabel()}
          </label>
          <input
            className="w-full bg-brand-dark border-brand-border rounded-lg text-sm text-slate-200 px-3 py-2"
            type="number"
            defaultValue={1.5}
          />
        </div>
        <div className="p-3 bg-brand-dark rounded-lg flex justify-between items-center text-xs">
          <span className="text-slate-400">Estimated RSC Minted:</span>
          <span className="text-brand-cyan font-mono">~3,675.00 RSC</span>
        </div>
        <button
          type="button"
          className="w-full py-3 bg-brand-cyan text-brand-dark font-bold rounded-lg uppercase tracking-wider text-sm hover:shadow-[0_0_15px_rgba(19,236,218,0.4)] transition-all"
        >
          {activeTab === 'MINT'
            ? 'Mint RSC'
            : activeTab === 'DEPOSIT'
            ? 'Deposit'
            : 'Redeem'}
        </button>
      </div>
    </section>
  );
};

export default ActionTabsCard;

