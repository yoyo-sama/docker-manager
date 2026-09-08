interface Props {
  title: string;
  value: number | string;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const iconColors = {
  blue: 'text-sky-600 dark:text-sky-400',
  green: 'text-emerald-600 dark:text-emerald-400',
  yellow: 'text-amber-600 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
  purple: 'text-violet-600 dark:text-violet-400',
};

const barColors = {
  blue: 'bg-sky-500',
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
  purple: 'bg-violet-500',
};

export default function StatCard({ title, value, unit, subtitle, icon, color = 'blue' }: Props) {
  const pct = unit === '%' ? (typeof value === 'number' ? value : parseFloat(String(value))) : NaN;

  return (
    <div className="bg-surface border border-line rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted pt-1.5">{title}</p>
        {icon && (
          <span className={`p-1.5 rounded-md bg-hover ${iconColors[color]}`}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums leading-none">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted">{unit}</span>}
      </p>
      {subtitle && <p className="mt-2 text-xs text-muted">{subtitle}</p>}
      {!Number.isNaN(pct) && (
        <div className="mt-3 h-1 rounded-full bg-hover overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${barColors[color]}`}
            style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
