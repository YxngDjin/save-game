import { convertFileSrc } from "@tauri-apps/api/core";
import { useState } from "react";
import { initials, tintFor } from "../gameArt";

interface GameImageProps {
  path: string | null | undefined;
  name: string;
  className?: string;
  textClassName?: string;
}

const GameImage = ({
  path,
  name,
  className = "",
  textClassName = "text-3xl",
}: GameImageProps) => {
  const [failedPath, setFailedPath] = useState<string | null>(null);

  if (path && path !== failedPath) {
    return (
      <img
        src={convertFileSrc(path)}
        alt=""
        onError={() => setFailedPath(path)}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-end p-3 font-display font-bold text-white ${textClassName} ${className}`}
      style={{ backgroundColor: tintFor(name) }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
};

export default GameImage;
