const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export const groupLabel = (iso: string, now: Date) => {
  const days = Math.round(
    (startOfDay(now) - startOfDay(new Date(iso))) / 86_400_000,
  );
  if (days <= 0) return "Heute";
  if (days === 1) return "Gestern";
  if (days < 7) return "Diese Woche";
  return "Älter";
};

export const timeLabel = (iso: string, group: string) => {
  const date = new Date(iso);
  if (group === "Heute" || group === "Gestern") {
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (group === "Diese Woche") {
    return date.toLocaleDateString("de-DE", { weekday: "short" });
  }
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
};
