interface RestoreButtonProps {
  armed: boolean;
  disabled: boolean;
  onArm: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const RestoreButton = ({
  armed,
  disabled,
  onArm,
  onCancel,
  onConfirm,
}: RestoreButtonProps) => {
  if (!armed) {
    return (
      <button
        type="button"
        onClick={onArm}
        disabled={disabled}
        className="rounded-lg border border-border-strong px-3 py-1.5 text-xs hover:bg-surface-2 disabled:opacity-50"
      >
        Wiederherstellen
      </button>
    );
  }
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
      >
        Ja, überschreiben
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-border-strong px-3 py-1.5 text-xs hover:bg-surface-2"
      >
        Abbrechen
      </button>
    </div>
  );
};

export default RestoreButton;
