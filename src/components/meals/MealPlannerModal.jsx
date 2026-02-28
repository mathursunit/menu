import { useState, useMemo } from 'react';
import { useMealPlannerPreferences } from '../../hooks/useMealPlannerPreferences';
import { useWeeklyMealGenerator } from '../../hooks/useWeeklyMealGenerator';
import useRecipes from '../../hooks/useRecipes';
import useMealPlan from '../../hooks/useMealPlan';
import { formatDate } from '../../utils/dates';
import '../common/Modal.css';
import './MealPlannerModal.css';

const CUISINES = [
  'indian',
  'italian',
  'mexican',
  'chinese',
  'american',
  'mediterranean',
  'thai',
  'japanese',
  'korean',
];

const DIFFICULTIES = ['quick', 'moderate', 'advanced'];

export function MealPlannerModal({ isOpen, onClose }) {
  const [step, setStep] = useState('preferences'); // 'preferences' | 'generating' | 'preview'
  const [weekStartDate, setWeekStartDate] = useState(new Date());
  const [generatedPlan, setGeneratedPlan] = useState(null);

  const { preferences, saveCuisines, setDifficulty } = useMealPlannerPreferences();
  const { recipes } = useRecipes();
  const { generateWeek, generating, generationError } = useWeeklyMealGenerator(
    preferences,
    recipes
  );
  const { applyGeneratedMeals } = useMealPlan(weekStartDate);

  const handleGenerate = async () => {
    setStep('generating');
    const plan = await generateWeek(weekStartDate);

    if (plan) {
      setGeneratedPlan(plan);
      setStep('preview');
    } else {
      setStep('preferences');
    }
  };

  const handleRegenerate = async () => {
    setStep('generating');
    const plan = await generateWeek(weekStartDate);

    if (plan) {
      setGeneratedPlan(plan);
      setStep('preview');
    }
  };

  const handleApply = async () => {
    if (!generatedPlan?.mealPlan) return;

    try {
      // Convert recipe names to recipe objects
      const mealPlanWithRecipes = {};
      for (const [dateId, meals] of Object.entries(generatedPlan.mealPlan)) {
        const mealsWithRecipes = {};
        for (const [mealType, recipeName] of Object.entries(meals)) {
          if (recipeName) {
            const recipe = recipes.find((r) => r.name === recipeName);
            mealsWithRecipes[mealType] = recipe || null;
          }
        }
        mealPlanWithRecipes[dateId] = mealsWithRecipes;
      }

      // Apply to calendar
      await applyGeneratedMeals(mealPlanWithRecipes);

      // Show success and close
      onClose();
    } catch (error) {
      console.error('Error applying meal plan:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Generate Weekly Meal Plan</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body meal-planner-modal">
          {step === 'preferences' && (
            <PreferencesStep
              preferences={preferences}
              saveCuisines={saveCuisines}
              setDifficulty={setDifficulty}
              weekStartDate={weekStartDate}
              setWeekStartDate={setWeekStartDate}
              onGenerate={handleGenerate}
              onCancel={onClose}
              generationError={generationError}
            />
          )}

          {step === 'generating' && (
            <GeneratingStep
              generationError={generationError}
              onRetry={handleGenerate}
              onBack={() => setStep('preferences')}
            />
          )}

          {step === 'preview' && (
            <PreviewStep
              generatedPlan={generatedPlan}
              weekStartDate={weekStartDate}
              recipes={recipes}
              onRegenerate={handleRegenerate}
              onApply={handleApply}
              onBack={() => setStep('preferences')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PreferencesStep({
  preferences,
  saveCuisines,
  setDifficulty,
  weekStartDate,
  setWeekStartDate,
  onGenerate,
  onCancel,
  generationError,
}) {
  const handleCuisineChange = (cuisine) => {
    const updated = preferences.cuisinePreferences.includes(cuisine)
      ? preferences.cuisinePreferences.filter((c) => c !== cuisine)
      : [...preferences.cuisinePreferences, cuisine];
    saveCuisines(updated);
  };

  const weekStart = new Date(weekStartDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div className="preferences-step">
      <div className="form-group">
        <label className="form-label">Week Starting</label>
        <input
          type="date"
          className="form-input"
          value={weekStartDate.toISOString().split('T')[0]}
          onChange={(e) => setWeekStartDate(new Date(e.target.value))}
        />
        <small className="form-helper">
          {formatDate(weekStart)} to {formatDate(weekEnd)}
        </small>
      </div>

      <div className="form-group">
        <label className="form-label">Preferred Cuisines</label>
        <div className="cuisines-grid">
          {CUISINES.map((cuisine) => (
            <label key={cuisine} className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.cuisinePreferences.includes(cuisine)}
                onChange={() => handleCuisineChange(cuisine)}
              />
              <span className="cuisine-name">{cuisine}</span>
            </label>
          ))}
        </div>
        {preferences.cuisinePreferences.length === 0 && (
          <small className="form-helper">All cuisines will be used</small>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Difficulty Level</label>
        <select
          className="form-select"
          value={preferences.difficultyLevel}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          {DIFFICULTIES.map((level) => (
            <option key={level} value={level}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </option>
          ))}
        </select>
        <small className="form-helper">
          {preferences.difficultyLevel === 'quick' && 'Recipes under 30 minutes'}
          {preferences.difficultyLevel === 'moderate' && 'Recipes under 60 minutes'}
          {preferences.difficultyLevel === 'advanced' && 'Any preparation time'}
        </small>
      </div>

      {generationError && <div className="error-message">{generationError}</div>}

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={onGenerate}>
          Generate Week
        </button>
      </div>
    </div>
  );
}

function GeneratingStep({ generationError, onRetry, onBack }) {
  return (
    <div className="generating-step">
      {generationError ? (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{generationError}</div>
          <div className="error-actions">
            <button className="btn btn-secondary" onClick={onBack}>
              Back to Preferences
            </button>
            <button className="btn btn-primary" onClick={onRetry}>
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="spinner"></div>
          <p className="generating-text">Generating 7 days of delicious meals...</p>
          <p className="generating-subtext">This usually takes 10-30 seconds...</p>
        </>
      )}
    </div>
  );
}

function PreviewStep({ generatedPlan, weekStartDate, recipes, onRegenerate, onApply, onBack }) {
  const weekStart = new Date(weekStartDate);
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const mealsByDay = useMemo(() => {
    const result = [];
    Object.entries(generatedPlan.mealPlan).forEach(([dateId, meals]) => {
      const date = new Date(dateId);
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
      const recipeNames = generatedPlan.recipeNames?.[dateId] || {};
      result.push({
        dateId,
        date,
        dayName: dayNames[dayIndex],
        meals,
        recipeNames,
      });
    });
    return result;
  }, [generatedPlan]);

  const getRecipeInfo = (recipeName) => {
    return recipes.find((r) => r.name === recipeName);
  };

  return (
    <div className="preview-step">
      <div className="preview-grid">
        {mealsByDay.map((day) => (
          <div key={day.dateId} className="day-card">
            <h4 className="day-header">
              {day.dayName}
              <span className="day-date">{formatDate(day.date)}</span>
            </h4>

            <div className="meals-list">
              {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                const recipeId = day.meals[mealType];
                const displayName = day.recipeNames?.[mealType] || '—';
                const recipe = getRecipeInfo(displayName);

                return (
                  <div key={mealType} className="meal-item">
                    <span className="meal-type">{mealType}</span>
                    <span className="recipe-name">{displayName}</span>
                    {recipe && (
                      <span className="meal-time">
                        {recipe.prepTime + recipe.cookTime}m
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onRegenerate}>
          Regenerate
        </button>
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button className="btn btn-primary" onClick={onApply}>
          Apply to Calendar
        </button>
      </div>
    </div>
  );
}
