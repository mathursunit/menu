import { useMemo } from 'react';
import { MEAL_TYPES } from '../utils/constants';

export default function useCookingStats(mealPlan) {
  return useMemo(() => {
    const stats = {
      totalPlanned: 0,
      totalCooked: 0,
      cookedByUser: {},
      mealsByType: { breakfast: 0, lunch: 0, dinner: 0 },
    };

    Object.values(mealPlan).forEach((dayPlan) => {
      if (!dayPlan?.meals) return;
      MEAL_TYPES.forEach((type) => {
        const meal = dayPlan.meals[type];
        if (meal?.recipeId) {
          stats.totalPlanned++;
          if (meal.isCooked) {
            stats.totalCooked++;
            stats.mealsByType[type]++;
            if (meal.cookedBy) {
              stats.cookedByUser[meal.cookedBy] = (stats.cookedByUser[meal.cookedBy] || 0) + 1;
            }
          }
        }
      });
    });

    return stats;
  }, [mealPlan]);
}
