import { getWeekDates } from './dates';

/**
 * Build a structured prompt for Gemini to generate a week of meal suggestions
 */
export function buildMealGenerationPrompt(preferences, filteredRecipes, weekStartDate) {
  const weekDates = getWeekDates(new Date(weekStartDate));
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Format recipe list for prompt
  const recipeList = filteredRecipes
    .slice(0, 50) // Limit to prevent token overflow
    .map(
      (recipe) =>
        `- ${recipe.name} (${recipe.tags?.join(', ') || 'general'}) | Prep: ${recipe.prepTime}m, Cook: ${recipe.cookTime}m`
    )
    .join('\n');

  const cuisineStr = preferences.cuisinePreferences?.length
    ? preferences.cuisinePreferences.join(', ')
    : 'all cuisines';

  const proteinPct = Math.round(preferences.macro.targetProteinRatio * 100);
  const carbPct = Math.round(preferences.macro.targetCarbRatio * 100);
  const fatPct = Math.round(preferences.macro.targetFatRatio * 100);

  const prompt = `You are an expert meal planning assistant. Generate a 7-day diverse meal plan based on the user's preferences.

USER PREFERENCES:
- Preferred cuisines: ${cuisineStr}
- Difficulty level: ${preferences.difficultyLevel}
- Macro targets: ${proteinPct}% protein, ${carbPct}% carbs, ${fatPct}% fat
- Avoid recipe repeats in this week
- Optimize for ingredient reuse (minimize shopping variety)
- Balance nutritional variety (different proteins, vegetables, carbs)

AVAILABLE RECIPES:
${recipeList}

MEAL PLAN REQUIREMENTS:
1. Generate exactly 7 days of meals (breakfast, lunch, dinner)
2. No recipe should appear more than once in the week
3. Meals should respect cuisine preferences
4. Consider difficulty level (${preferences.difficultyLevel})
5. Optimize for ingredient overlap where possible (e.g., if using chicken in a recipe, consider other chicken recipes)
6. Provide variety across different meal types (sandwiches, salads, cooked meals, etc.)

RESPONSE FORMAT:
Return ONLY valid JSON (no markdown, no code blocks, no explanations):
{
  "mealPlan": {
    "day1": { "breakfast": "recipe name", "lunch": "recipe name", "dinner": "recipe name" },
    "day2": { "breakfast": "recipe name", "lunch": "recipe name", "dinner": "recipe name" },
    "day3": { "breakfast": "recipe name", "lunch": "recipe name", "dinner": "recipe name" },
    "day4": { "breakfast": "recipe name", "lunch": "recipe name", "dinner": "recipe name" },
    "day5": { "breakfast": "recipe name", "lunch": "recipe name", "dinner": "recipe name" },
    "day6": { "breakfast": "recipe name", "lunch": "recipe name", "dinner": "recipe name" },
    "day7": { "breakfast": "recipe name", "lunch": "recipe name", "dinner": "recipe name" }
  }
}

IMPORTANT:
- Use recipe names exactly as shown in the available recipes list
- Each meal should be a single recipe name from the list
- No explanations or additional text
- Valid JSON only`;

  return prompt;
}
