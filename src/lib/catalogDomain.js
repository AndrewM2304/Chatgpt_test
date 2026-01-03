import { normalizeCookbookEntries } from "../utils/cookbookUtils.js";

export const buildRecipeById = (recipes) =>
  recipes.reduce((accumulator, recipe) => {
    accumulator[recipe.id] = recipe;
    return accumulator;
  }, {});

export const buildCookbookCoverTargets = ({
  recipes,
  cookbookEntries,
  cookbookOptions,
}) => {
  const targets = new Set(cookbookOptions);
  cookbookEntries.forEach((entry) => targets.add(entry.title));
  const hasWebsiteRecipes = recipes.some(
    (recipe) =>
      recipe.sourceType === "website" || (!recipe.sourceType && recipe.url)
  );
  if (hasWebsiteRecipes || cookbookEntries.some((entry) => entry.title === "Website")) {
    targets.add("Website");
  }
  return Array.from(targets).sort((a, b) => a.localeCompare(b));
};

export const buildCookbookCoverMap = (cookbookEntries) =>
  normalizeCookbookEntries(cookbookEntries).reduce((accumulator, entry) => {
    if (entry.coverUrl) {
      accumulator[entry.title] = entry.coverUrl;
    }
    return accumulator;
  }, {});
