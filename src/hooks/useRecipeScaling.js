import { useMemo } from 'react';
import { scaleRecipe, getScaledTime } from '../utils/recipeScaler';

/**
 * Hook for scaling a recipe to different serving sizes
 * @param {object} recipe - recipe object with baseServings, ingredients, prepTime, cookTime
 * @param {number} targetServings - desired number of servings
 * @returns {object} - { scaledRecipe, scaleFactor, timeNotes }
 */
export function useRecipeScaling(recipe, targetServings = null) {
  const baseServings = recipe?.baseServings || 2;
  const servings = targetServings || baseServings;

  const { scaledRecipe, scaleFactor, prepTimeNote, cookTimeNote } = useMemo(() => {
    if (!recipe || servings === baseServings) {
      return {
        scaledRecipe: recipe,
        scaleFactor: 1,
        prepTimeNote: '',
        cookTimeNote: '',
      };
    }

    const factor = servings / baseServings;
    const scaled = scaleRecipe(recipe, baseServings, servings);

    const { note: prepNote } = getScaledTime(recipe.prepTime, factor);
    const { note: cookNote } = getScaledTime(recipe.cookTime, factor);

    return {
      scaledRecipe: scaled,
      scaleFactor: factor,
      prepTimeNote: prepNote,
      cookTimeNote: cookNote,
    };
  }, [recipe, servings, baseServings]);

  return {
    scaledRecipe,
    scaleFactor,
    prepTimeNote,
    cookTimeNote,
    baseServings,
  };
}

export default useRecipeScaling;
