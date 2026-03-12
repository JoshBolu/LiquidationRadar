import type { RiskLevel } from "../../types/dashboard";

type StatusVariant = "safe" | "warning" | "critical" | "info";

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  className?: string;
}

const variantClasses: Record<StatusVariant, string> = {
  safe: "bg-emerald-500 text-brand-dark",
  warning: "bg-amber-500 text-brand-dark",
  critical: "bg-rose-500 text-brand-dark",
  info: "bg-slate-600 text-slate-100",
};

export const riskLevelToVariant = (risk: RiskLevel): StatusVariant => {
  switch (risk) {
    case "SAFE":
      return "safe";
    case "WARNING":
    case "RISK":
      return "warning";
    case "LIQUIDATABLE":
    case "CRITICAL":
      return "critical";
    default:
      return "info";
  }
};

const StatusBadge = ({
  label,
  variant = "info",
  className = "",
}: StatusBadgeProps) => {
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold ${variantClasses[variant]} ${className}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
