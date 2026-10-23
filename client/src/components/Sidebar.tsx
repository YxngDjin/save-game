import type { PairingStatus } from "../types";
export type View =
  | { name: "games" }
  | { name: "game"; launcherId: string }
  | { name: "settings" };

const items = [
  { name: "games", label: "Spiele" },
  { name: "settings", label: "Einstellungen" },
] as const;

interface SidebarProps {
  view: View;
  pairing: PairingStatus | null;
  onNavigate: (view: View) => void;
}

export const Sidebar = ({ view, pairing, onNavigate }: SidebarProps) => {
  const active = view.name === "game" ? "games" : view.name;

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="h-7 w-7 rounded-md bg-neutral-900" aria-hidden="true" />
        <span className="text-lg font-semibold">SaveGame</span>
      </div>

      <nav
        className="flex flex-1 flex-col gap-1 px-3"
        aria-label="Hauptnavigation"
      >
        {items.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => onNavigate({ name: item.name })}
            className={`rounded-lg px-3 py-2.5 text-left text-sm ${
              active === item.name
                ? "bg-neutral-100 font-semibold text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-neutral-200 px-5 py-4 text-xs text-neutral-500">
        {pairing?.paired ? (
          <>
            <div className="flex items-center gap-2 font-medium text-neutral-700">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Verbunden
            </div>
            <div className="mt-1 truncate">{pairing.serverUrl}</div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-neutral-300" />
            Nicht gekoppelt
          </div>
        )}
      </div>
    </aside>
  );
};
