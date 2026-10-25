import type { ReactNode } from "react";

interface SettingRowProps {
  title: string;
  description?: string;
  badge?: string;
  children: ReactNode;
}

const SettingRow = ({
  title,
  description,
  badge,
  children,
}: SettingRowProps) => {
  return (
    <div className="flex items-center gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2 text-sm font-medium">
          {title}
          {badge && (
            <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs font-semibold text-muted">
              {badge}
            </span>
          )}
        </span>
        {description && (
          <span className="text-sm text-muted">{description}</span>
        )}
      </div>
      {children}
    </div>
  );
};

export default SettingRow;
