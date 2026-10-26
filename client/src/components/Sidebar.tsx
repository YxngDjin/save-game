import { Clock, Gamepad, Settings } from "lucide-react";

export type View =
  | { name: "games" }
  | { name: "game"; launcherId: string; versionKey?: string }
  | { name: "history" }
  | { name: "settings" };

const items = [
  {
    name: "games",
    label: "Spiele",
    icon: <Gamepad size={18} aria-hidden="true" />,
  },
  {
    name: "history",
    label: "Verlauf",
    icon: <Clock size={18} aria-hidden="true" />,
  },
  {
    name: "settings",
    label: "Einstellungen",
    icon: <Settings size={18} aria-hidden="true" />,
  },
] as const;

interface SidebarProps {
  view: View;
  onNavigate: (view: View) => void;
}

export const Sidebar = ({ view, onNavigate }: SidebarProps) => {
  const active = view.name === "game" ? "games" : view.name;

  return (
    <aside className="flex bg-surface w-56 shrink-0 flex-col border-r border-border">
      <nav
        className="flex flex-1 mt-4 flex-col gap-1 px-3"
        aria-label="Hauptnavigation"
      >
        {items.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => onNavigate({ name: item.name })}
            className={`rounded-lg px-3 py-2.5 hover:text-accent flex items-center gap-2 text-left text-sm ${
              active === item.name
                ? "bg-surface-3 font-semibold text-text"
                : "text-muted hover:bg-bg"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};
