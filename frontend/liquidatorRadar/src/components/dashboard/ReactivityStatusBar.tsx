import type { ReactivityStatus } from '../../types/dashboard';

interface ReactivityStatusBarProps {
  status: ReactivityStatus | null;
}

const ReactivityStatusBar = ({ status }: ReactivityStatusBarProps) => {
  if (!status) {
    return (
      <section className="bg-brand-dark border border-brand-border rounded-lg px-4 py-2 text-[11px] font-mono text-slate-500">
        Reactivity status will appear when subscriptions are active.
      </section>
    );
  }
  return (
    <section
      className="bg-brand-dark border border-brand-border rounded-lg px-4 py-2 flex items-center justify-between text-[11px] font-mono"
      data-purpose="reactivity-status"
    >
      <div className="flex items-center space-x-4">
        <span className="flex items-center space-x-1">
          <span className="text-slate-500">STATUS:</span>
          <span className="text-emerald-400">{status.status}</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="text-slate-500">LAST BLOCK:</span>
          <span className="text-brand-cyan">{status.lastBlock}</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="text-slate-500">MODE:</span>
          <span className="text-slate-200">{status.mode}</span>
        </span>
      </div>
      <div className="text-slate-500 italic">{status.detail}</div>
    </section>
  );
};

export default ReactivityStatusBar;

