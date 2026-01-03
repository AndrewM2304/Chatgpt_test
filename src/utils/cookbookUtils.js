export const normalizeCookbookEntry = (entry) => {
  if (!entry) {
    return null;
  }
  if (typeof entry === "string") {
    return { title: entry, coverUrl: "" };
  }
  if (typeof entry === "object") {
    return {
      title: entry.title || "",
      coverUrl: entry.coverUrl || "",
    };
  }
  return null;
};

export const normalizeCookbookEntries = (entries) =>
  (Array.isArray(entries) ? entries : [])
    .map(normalizeCookbookEntry)
    .filter((entry) => entry?.title);

export const mergeCookbookEntries = (entries, titles) => {
  const normalized = normalizeCookbookEntries(entries);
  const entryMap = new Map(normalized.map((entry) => [entry.title, entry]));
  return titles.map((title) => entryMap.get(title) || { title, coverUrl: "" });
};

export const areCookbookEntriesEqual = (left, right) => {
  const leftNormalized = normalizeCookbookEntries(left);
  const rightNormalized = normalizeCookbookEntries(right);
  if (leftNormalized.length !== rightNormalized.length) {
    return false;
  }
  return leftNormalized.every((entry, index) => {
    const compare = rightNormalized[index];
    return (
      entry.title === compare.title &&
      (entry.coverUrl || "") === (compare.coverUrl || "")
    );
  });
};
