import type { ReactNode } from 'react';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
  className?: string;
  children: ReactNode;
}

const SectionCard = ({
  title,
  subtitle,
  headerRight,
  className = '',
  children,
}: SectionCardProps) => {
  const hasHeader = title || subtitle || headerRight;

  return (
    <section
      className={`bg-brand-card rounded-xl border border-brand-border min-h-[160px] ${className}`}
    >
      {hasHeader && (
        <div className="p-5 pb-0 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </div>
      )}
      <div className={hasHeader ? 'p-5 pt-4' : 'p-5'}>{children}</div>
    </section>
  );
};

export default SectionCard;

