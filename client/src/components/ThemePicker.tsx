import { Monitor, Moon, Sun } from "lucide-react";
import type { Theme } from "../hooks/useTheme";

const options = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Hell", icon: Sun },
  { value: "dark", label: "Dunkel", icon: Moon },
] as const;

interface ThemePickerProps {
  value: Theme;
  onChange: (theme: Theme) => void;
}

const ThemePicker = ({ value, onChange }: ThemePickerProps) => {
  return (
    <div
      role="radiogroup"
      aria-label="Design"
      className="flex gap-1 self-start rounded-xl border border-border bg-surface-2 p-1"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
              active
                ? "bg-surface text-text shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            <Icon size={16} aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default ThemePicker;
