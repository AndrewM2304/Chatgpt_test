import { useMemo, useState } from "react";
import { RandomView } from "../components/RandomView";

export const RandomRoute = ({ recipes, cuisineOptions, onStartLog }) => {
  const [excludedCuisines, setExcludedCuisines] = useState([]);
  const [randomPick, setRandomPick] = useState(null);

  const randomCandidates = useMemo(() => {
    if (!recipes.length) {
      return [];
    }
    return recipes.filter((recipe) => {
      if (!recipe.cuisine) {
        return true;
      }
      return !excludedCuisines.includes(recipe.cuisine);
    });
  }, [excludedCuisines, recipes]);

  const handleToggleCuisine = (cuisine) => {
    setExcludedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((item) => item !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handlePickRandom = () => {
    if (!randomCandidates.length) {
      setRandomPick(null);
      return;
    }
    const index = Math.floor(Math.random() * randomCandidates.length);
    setRandomPick(randomCandidates[index]);
  };

  return (
    <RandomView
      cuisineOptions={cuisineOptions}
      excludedCuisines={excludedCuisines}
      onToggleCuisine={handleToggleCuisine}
      onPickRandom={handlePickRandom}
      randomCandidates={randomCandidates}
      randomPick={randomPick}
      onStartLog={onStartLog}
      hasRecipes={recipes.length > 0}
    />
  );
};
