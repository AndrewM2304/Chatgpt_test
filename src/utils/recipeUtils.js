export const groupOptions = [
  { value: "none", label: "All recipes" },
  { value: "cookbook", label: "Cookbook" },
  { value: "cuisine", label: "Cuisine" },
  { value: "times", label: "Times cooked" },
];

export const timesBuckets = [
  { label: "Never cooked", test: (count) => count === 0 },
  { label: "1-2 times", test: (count) => count >= 1 && count <= 2 },
  { label: "3-5 times", test: (count) => count >= 3 && count <= 5 },
  { label: "6+ times", test: (count) => count >= 6 },
];

export const getInitials = (title) =>
  title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

export const getCoverColor = (title) => {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 88%)`;
};

export const formatDate = (value) => {
  if (!value) {
    return "Not cooked yet";
  }
  return new Date(value).toLocaleDateString();
};
