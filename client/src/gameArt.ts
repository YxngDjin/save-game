export const tints = [
  "#2D5B73",
  "#3C3F58",
  "#6B2E2E",
  "#5A4630",
  "#3F5F2C",
  "#6E4E1F",
  "#5B3A6E",
  "#4A4636",
];

export const initials = (name: string) => {
  const words = name.split(" ").filter((word) => word.length > 0);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const tintFor = (name: string) => {
  let sum = 0;
  for (const char of name) {
    sum += char.charCodeAt(0);
  }
  return tints[sum % tints.length];
};
