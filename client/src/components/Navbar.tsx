import { Bell, MoonIcon, Save, SunIcon } from "lucide-react";
import IconButton from "./IconButton";
import Searchbar from "./Searchbar";
import type { PairingStatus } from "../types";
import { type ServerStatus } from "../hooks/useServerStatus";

interface NavbarProps {
  search: string;
  isDark: boolean;
  pairing: PairingStatus | null;
  serverStatus: ServerStatus;
  onToggleTheme: () => void;
  onSearchChange: (value: string) => void;
}

const statusStyles: Record<
  ServerStatus,
  { pill: string; dot: string; label: string }
> = {
  online: {
    pill: "bg-accent/15 text-accent-text",
    dot: "bg-accent",
    label: "Server verbunden",
  },
  offline: {
    pill: "bg-danger/10 text-danger",
    dot: "bg-danger",
    label: "Server nicht erreichbar",
  },
  checking: {
    pill: "bg-surface-3 text-muted",
    dot: "bg-muted animate-pulse",
    label: "Verbinde …",
  },
  unpaired: {
    pill: "bg-surface-3 text-muted",
    dot: "bg-muted",
    label: "Nicht gekoppelt",
  },
};

const Navbar = ({
  search,
  onSearchChange,
  pairing,
  isDark,
  onToggleTheme,
  serverStatus,
}: NavbarProps) => {
  const style = statusStyles[serverStatus];
  const host = pairing?.serverUrl?.replace(/^https?:\/\//, "");

  return (
    <header className="flex w-full border-b border-border items-center px-5 bg-surface justify-between">
      <div className="flex items-center gap-2 py-3">
        <div
          className="flex  items-center justify-center text-accent"
          aria-hidden="true"
        >
          <Save size={18} />
        </div>
        <span className="text-lg font-display font-bold">SaveGame</span>
        <Searchbar value={search} onChange={onSearchChange} />
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium ${style.pill}`}
        >
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          {style.label}
          {serverStatus === "online" && host && ` · ${host}`}
        </div>
        <IconButton
          ariaLabel="Benachrichtigungen"
          icon={<Bell size={18} />}
          onClick={() => {}}
        />
        <IconButton
          icon={isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          onClick={onToggleTheme}
          ariaLabel={isDark ? "Helles Design" : "Dunkles Design"}
        />
      </div>
    </header>
  );
};

export default Navbar;
