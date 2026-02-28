import { useState, useCallback } from 'react';
import { buildMealGenerationPrompt } from '../utils/mealGenerationPrompt';
import { getWeekDates } from '../utils/dates';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

function friendlyError(err) {
  const msg = (err?.message ?? '').toLowerCase();
  const code = String(err?.status ?? err?.code ?? '').toLowerCase();
  const full = `${code} ${msg}`;

  if (full.includes('quota') || full.includes('429') || full.includes('resource_exhausted'))
    return '⏳ Rate limited — please try again in a few minutes. We generate meals using AI which has usage limits.';
  if (full.includes('api_key') || full.includes('403') || full.includes('permission'))
    return 'API configuration issue — contact support@menu.mysunsar.com';
  if (full.includes('network') || full.includes('failed to fetch'))
    return 'Network error — check your internet connection and try again';
  if (full.includes('invalid') || full.includes('parse'))
    return 'Invalid response from meal generator — try different preferences or try again in a moment';
  return "Couldn't generate meal suggestions. Try different preferences, check your connection, or try again.";
}

export function useWeeklyMealGenerator(preferences, allRecipes) {
  const [generating, setGenerating] = useState(false);
  const [generationError, setError] = useState(null);

  const generateWeek = useCallback(
    async (weekStartDate) => {
      if (!preferences || !allRecipes?.length) {
        setError('Missing preferences or recipes');
        return null;
      }

      setGenerating(true);
      setError(null);

      try {
        // Get week dates
        const weekDates = getWeekDates(new Date(weekStartDate));

        // Filter recipes by preferences
        const filteredRecipes = filterRecipesByPreferences(
          allRecipes,
          preferences,
          weekStartDate
        );

        if (!filteredRecipes.length) {
          setError('No recipes match your preferences. Try selecting different cuisines, reducing difficulty level, or adding more recipes to your collection.');
          setGenerating(false);
          return null;
        }

        // Warn if very few recipes match (might lead to repetition)
        if (filteredRecipes.length < 21) {
          console.warn(`Only ${filteredRecipes.length} recipes match preferences (need 21 for 7 days without repeats)`);
        }

        // Build prompt
        const prompt = buildMealGenerationPrompt(
          preferences,
          filteredRecipes,
          weekStartDate
        );

        // Call Gemini API
        const response = await fetch(GEMINI_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'OBJECT',
                properties: {
                  mealPlan: {
                    type: 'OBJECT',
                    properties: {
                      day1: {
                        type: 'OBJECT',
                        properties: {
                          breakfast: { type: 'STRING' },
                          lunch: { type: 'STRING' },
                          dinner: { type: 'STRING' },
                        },
                        required: ['breakfast', 'lunch', 'dinner'],
                      },
                      day2: {
                        type: 'OBJECT',
                        properties: {
                          breakfast: { type: 'STRING' },
                          lunch: { type: 'STRING' },
                          dinner: { type: 'STRING' },
                        },
                        required: ['breakfast', 'lunch', 'dinner'],
                      },
                      day3: {
                        type: 'OBJECT',
                        properties: {
                          breakfast: { type: 'STRING' },
                          lunch: { type: 'STRING' },
                          dinner: { type: 'STRING' },
                        },
                        required: ['breakfast', 'lunch', 'dinner'],
                      },
                      day4: {
                        type: 'OBJECT',
                        properties: {
                          breakfast: { type: 'STRING' },
                          lunch: { type: 'STRING' },
                          dinner: { type: 'STRING' },
                        },
                        required: ['breakfast', 'lunch', 'dinner'],
                      },
                      day5: {
                        type: 'OBJECT',
                        properties: {
                          breakfast: { type: 'STRING' },
                          lunch: { type: 'STRING' },
                          dinner: { type: 'STRING' },
                        },
                        required: ['breakfast', 'lunch', 'dinner'],
                      },
                      day6: {
                        type: 'OBJECT',
                        properties: {
                          breakfast: { type: 'STRING' },
                          lunch: { type: 'STRING' },
                          dinner: { type: 'STRING' },
                        },
                        required: ['breakfast', 'lunch', 'dinner'],
                      },
                      day7: {
                        type: 'OBJECT',
                        properties: {
                          breakfast: { type: 'STRING' },
                          lunch: { type: 'STRING' },
                          dinner: { type: 'STRING' },
                        },
                        required: ['breakfast', 'lunch', 'dinner'],
                      },
                    },
                    required: ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'],
                  },
                },
                required: ['mealPlan'],
              },
            },
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const apiErr = errData?.error ?? {};
          throw Object.assign(
            new Error(apiErr.message ?? `HTTP ${response.status}`),
            { status: response.status, code: apiErr.status }
          );
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse Gemini response:', e, 'Raw text:', text);
          setError('Meal generation returned invalid data. Try adjusting preferences and try again.');
          setGenerating(false);
          return null;
        }

        // Validate response structure
        if (!parsed.mealPlan || typeof parsed.mealPlan !== 'object') {
          console.error('Invalid meal plan structure:', parsed);
          setError("Generated meal plan had unexpected format. Try different preferences.");
          setGenerating(false);
          return null;
        }

        // Map recipe names to IDs (keep both for preview and storage)
        const mealPlanWithIds = mapRecipeNamesToIds(parsed.mealPlan, allRecipes);

        // Return structured meal plan with both IDs and names
        const result = {
          weekDates,
          mealPlan: {},
          recipeNames: {}, // Store recipe names for display in preview
        };

        weekDates.forEach((date, idx) => {
          const dayKey = `day${idx + 1}`;
          const dayData = mealPlanWithIds[dayKey];
          const originalDayData = parsed.mealPlan[dayKey];

          result.mealPlan[date] = {
            breakfast: dayData?.breakfast || null,
            lunch: dayData?.lunch || null,
            dinner: dayData?.dinner || null,
          };

          // Store the original recipe names for preview display
          result.recipeNames[date] = {
            breakfast: originalDayData?.breakfast || null,
            lunch: originalDayData?.lunch || null,
            dinner: originalDayData?.dinner || null,
          };
        });

        setGenerating(false);
        return result;
      } catch (err) {
        console.error('Meal generation error:', err);
        setError(friendlyError(err));
        setGenerating(false);
        return null;
      }
    },
    [preferences, allRecipes]
  );

  return { generateWeek, generating, generationError };
}

/**
 * Filter recipes based on user preferences
 */
function filterRecipesByPreferences(recipes, preferences, weekStartDate) {
  return recipes.filter((recipe) => {
    // Filter by cuisine if preferences specified
    if (preferences.cuisinePreferences?.length > 0) {
      const recipeCuisines = recipe.tags || [];
      const hasMatchingCuisine = preferences.cuisinePreferences.some((cuisine) =>
        recipeCuisines.includes(cuisine)
      );
      if (!hasMatchingCuisine) return false;
    }

    // Filter by difficulty level (proxy: prep + cook time)
    const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
    switch (preferences.difficultyLevel) {
      case 'quick':
        if (totalTime > 30) return false;
        break;
      case 'moderate':
        if (totalTime > 60) return false;
        break;
      case 'advanced':
        // No time restriction
        break;
      default:
        break;
    }

    // Exclude recently used recipes
    if (preferences.excludeRecipeIds?.includes(recipe.id)) return false;

    return true;
  });
}

/**
 * Map recipe names from Gemini response to recipe IDs
 */
function mapRecipeNamesToIds(mealPlan, allRecipes) {
  const recipeMap = {};
  allRecipes.forEach((recipe) => {
    recipeMap[recipe.name?.toLowerCase()] = recipe.id;
  });

  const result = {};
  const dayKeys = Object.keys(mealPlan).sort();

  dayKeys.forEach((dayKey) => {
    const day = mealPlan[dayKey];
    result[dayKey] = {
      breakfast: recipeMap[day.breakfast?.toLowerCase()] || null,
      lunch: recipeMap[day.lunch?.toLowerCase()] || null,
      dinner: recipeMap[day.dinner?.toLowerCase()] || null,
    };
  });

  return result;
}
