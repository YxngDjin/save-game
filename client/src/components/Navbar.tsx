import { Bell, MoonIcon, Save, SunIcon } from "lucide-react";
import IconButton from "./IconButton";
import Searchbar from "./Searchbar";
import type { PairingStatus } from "../types";

interface NavbarProps {
  search: string;
  isDark: boolean;
  pairing: PairingStatus | null;
  onToggleTheme: () => void;
  onSearchChange: (value: string) => void;
}

const Navbar = ({
  search,
  onSearchChange,
  pairing,
  isDark,
  onToggleTheme,
}: NavbarProps) => {
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
          className={`h-9 px-3 items-center gap-2 flex rounded-full ${pairing?.paired ? "bg-accent-soft/13" : "bg-danger/10"}`}
        >
          <div
            className={`h-2 w-2 rounded-full ${pairing?.paired ? "bg-accent-text" : "bg-danger"}`}
          />
          <span
            className={`font-medium text-sm ${pairing?.paired ? "text-accent-text" : "text-danger"}`}
          >
            {pairing?.paired
              ? `Server verbunden · ${pairing.serverUrl?.replace("http://", "")}`
              : "Nicht verbunden"}
          </span>
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
