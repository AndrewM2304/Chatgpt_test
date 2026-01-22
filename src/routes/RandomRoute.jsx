import { useCallback, useEffect, useMemo, useState } from "react";
import { RandomView } from "../components/RandomView";
import { durationBuckets } from "../utils/recipeUtils";

export const RandomRoute = ({
  recipes,
  cuisineOptions,
  onStartLog,
  cookbookCovers,
  onRatingChange,
}) => {
  const [selectedCuisine, setSelectedCuisine] = useState("all");
  const [selectedDuration, setSelectedDuration] = useState("all");
  const [randomPick, setRandomPick] = useState(null);

  const randomCandidates = useMemo(() => {
    if (!recipes.length) {
      return [];
    }
    return recipes.filter((recipe) => {
      if (selectedCuisine !== "all" && recipe.cuisine !== selectedCuisine) {
        return false;
      }
      if (selectedDuration === "all") {
        return true;
      }
      const bucket = durationBuckets.find(
        (item) => item.label === selectedDuration
      );
      return bucket ? bucket.test(recipe.durationMinutes) : true;
    });
  }, [recipes, selectedCuisine, selectedDuration]);

  const handlePickRandom = useCallback(() => {
    if (!randomCandidates.length) {
      setRandomPick(null);
      return;
    }
    const index = Math.floor(Math.random() * randomCandidates.length);
    setRandomPick(randomCandidates[index]);
  }, [randomCandidates]);

  useEffect(() => {
    if (!randomCandidates.length) {
      setRandomPick(null);
      return;
    }
    if (!randomPick) {
      handlePickRandom();
      return;
    }
    const updatedPick = randomCandidates.find(
      (recipe) => recipe.id === randomPick.id
    );
    if (!updatedPick) {
      handlePickRandom();
      return;
    }
    if (updatedPick !== randomPick) {
      setRandomPick(updatedPick);
    }
  }, [handlePickRandom, randomCandidates, randomPick]);

  return (
    <RandomView
      cuisineOptions={cuisineOptions}
      durationOptions={durationBuckets}
      selectedCuisine={selectedCuisine}
      selectedDuration={selectedDuration}
      onCuisineChange={setSelectedCuisine}
      onDurationChange={setSelectedDuration}
      onPickRandom={handlePickRandom}
      randomCandidates={randomCandidates}
      randomPick={randomPick}
      onStartLog={onStartLog}
      hasRecipes={recipes.length > 0}
      cookbookCovers={cookbookCovers}
      onRatingChange={onRatingChange}
    />
  );
};
