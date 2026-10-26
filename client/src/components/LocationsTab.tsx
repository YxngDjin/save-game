import type { SaveLocation } from "../types";

interface LocationsTabProps {
  locations: SaveLocation[];
  manifestName: string;
}

const LocationsTab = ({ locations, manifestName }: LocationsTabProps) => {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      {locations.length === 0 ? (
        <p className="text-sm text-muted">Keine Spielstände gefunden.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {locations.map((location) => (
            <li
              key={location.rawPath}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 font-mono text-xs break-all"
            >
              {location.rawPath}
              {location.tags.length > 0 && (
                <span className="ml-2 font-sans text-muted">
                  [{location.tags.join(", ")}]
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted">
        Quelle: Ludusavi-Manifest ({manifestName})
      </p>
    </section>
  );
};

export default LocationsTab;
