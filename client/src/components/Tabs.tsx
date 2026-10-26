interface Tab<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (id: T) => void;
}

const Tabs = <T extends string>({ tabs, active, onChange }: TabsProps<T>) => {
  return (
    <div role="tablist" className="flex gap-1 border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`-mb-px flex h-11 items-center gap-1.5 border-b-2 px-3 text-sm ${
              isActive
                ? "border-accent font-semibold text-text"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-muted">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
