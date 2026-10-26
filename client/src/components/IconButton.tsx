import React from "react";

interface IconButtonProps {
  icon: React.JSX.Element;
  ariaLabel?: string;
  onClick: () => void;
}

const IconButton = ({ icon, ariaLabel, onClick }: IconButtonProps) => {
  return (
    <button
      className="w-10 h-10 border-border border rounded-lg bg-surface py-4 items-center justify-center flex"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {icon}
    </button>
  );
};

export default IconButton;
