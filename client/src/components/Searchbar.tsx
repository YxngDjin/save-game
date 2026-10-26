import { Search } from "lucide-react";
import { useEffect, useRef } from "react";

interface SearchbarProps {
  value: string;
  onChange: (value: string) => void;
}

const Searchbar = ({ value, onChange }: SearchbarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <label className="flex h-10 w-full max-w-md items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-muted focus-within:border-accent">
      <Search size={16} aria-hidden="true" />
      <span className="sr-only">Spiele durchsuchen</span>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onChange("");
            inputRef.current?.blur();
          }
        }}
        placeholder="Spiel suchen ..."
        className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted"
      />
      <kbd className="rounded border border-border-strong px-1.5 font-mono text-[11px] text-muted">
        Strg K
      </kbd>
    </label>
  );
};

export default Searchbar;
