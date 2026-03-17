import { useToast } from "../../context/ToastContext";

const typeStyles: Record<string, string> = {
  error: "border-red-500/50 bg-red-950/90 text-red-100",
  success: "border-emerald-500/50 bg-emerald-950/90 text-emerald-100",
  info: "border-brand-cyan/50 bg-slate-800/95 text-slate-200",
};

export default function Toaster() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-[360px] w-full pointer-events-none"
      aria-live="polite"
      role="status"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm ${typeStyles[toast.type] ?? typeStyles.error}`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/30"
              aria-label="Dismiss"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
