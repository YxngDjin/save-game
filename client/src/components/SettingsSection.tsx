import type { ReactNode } from "react";

interface SettingsSection {
  title: string;
  description?: string;
  children: ReactNode;
}

const SettingsSection = ({ title, description, children }: SettingsSection) => {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
};

export default SettingsSection;
