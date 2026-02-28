import { useState, useMemo } from 'react';
import useShoppingList from '../../hooks/useShoppingList';
import useRecipes from '../../hooks/useRecipes';
import useMealPlan from '../../hooks/useMealPlan';
import { consolidateIngredients } from '../../utils/ingredients';
import { getWeekStart, getWeekDates, formatDate, formatWeekRange } from '../../utils/dates';
import { MEAL_TYPES } from '../../utils/constants';
import { ShoppingCart, Plus, Trash2, Check, RefreshCw } from 'lucide-react';
import './ShoppingList.css';

export default function ShoppingList() {
  const today = new Date();
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getWeekStart(today));
  const weekDates = useMemo(() => getWeekDates(selectedWeekStart), [selectedWeekStart]);
  const { mealPlan } = useMealPlan(selectedWeekStart, 'week');
  const { recipes } = useRecipes();
  const { lists, loading, createList, toggleItem, deleteList } = useShoppingList();

  const [generating, setGenerating] = useState(false);

  const goToPreviousWeek = () => {
    const prev = new Date(selectedWeekStart);
    prev.setDate(prev.getDate() - 7);
    setSelectedWeekStart(getWeekStart(prev));
  };

  const goToNextWeek = () => {
    const next = new Date(selectedWeekStart);
    next.setDate(next.getDate() + 7);
    setSelectedWeekStart(getWeekStart(next));
  };

  const goToThisWeek = () => {
    setSelectedWeekStart(getWeekStart(today));
  };

  const generateList = async () => {
    if (loading) {
      alert('Meal plan is still loading. Please wait a moment and try again.');
      return;
    }

    setGenerating(true);
    try {
      // Get all recipes from the selected week's meal plan
      const plannedRecipes = [];
      let mealsFound = 0;

      weekDates.forEach((dateId) => {
        const dayPlan = mealPlan[dateId];
        if (!dayPlan?.meals) return;

        MEAL_TYPES.forEach((type) => {
          const meal = dayPlan.meals[type];
          // Meal object should have recipeId and recipeName from Firestore
          if (meal?.recipeId) {
            mealsFound++;
            // Find the recipe by ID
            const recipe = recipes.find((r) => r.id === meal.recipeId);
            if (recipe) {
              plannedRecipes.push(recipe);
            } else {
              console.warn(`Recipe not found for ID: ${meal.recipeId} (${meal.recipeName})`);
            }
          }
        });
      });

      if (mealsFound === 0) {
        alert('No meals planned for this week. Go to the calendar and add some meals first!');
        return;
      }

      // Remove duplicates and consolidate ingredients
      const uniqueRecipes = Array.from(
        new Map(plannedRecipes.map((r) => [r.id, r])).values()
      );
      const items = consolidateIngredients(uniqueRecipes);

      if (items.length === 0) {
        alert(`Found ${mealsFound} meals but no ingredients. Make sure your recipes have ingredients listed.`);
        return;
      }

      const startDate = weekDates[0];
      const endDate = weekDates[6];
      await createList(startDate, endDate, items);
      alert(`✓ Shopping list created with ${items.length} items!`);
    } catch (error) {
      console.error('Error generating shopping list:', error);
      alert('Error creating shopping list. Check the console for details.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="shopping-page">
      <div className="shopping-header">
        <h2>Shopping Lists</h2>
        <div className="shopping-controls">
          <div className="week-selector">
            <button className="btn btn-secondary" onClick={goToPreviousWeek} title="Previous week">
              ← Prev
            </button>
            <span className="week-range">{formatWeekRange(selectedWeekStart)}</span>
            <button className="btn btn-secondary" onClick={goToNextWeek} title="Next week">
              Next →
            </button>
            {formatWeekRange(selectedWeekStart) !== formatWeekRange(getWeekStart(today)) && (
              <button className="btn btn-secondary" onClick={goToThisWeek} title="Go to this week">
                This Week
              </button>
            )}
          </div>
          <button className="btn btn-primary" onClick={generateList} disabled={generating}>
            <Plus size={18} />
            <span>{generating ? 'Generating...' : 'Generate List'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <p className="shopping-empty">Loading...</p>
      ) : lists.length === 0 ? (
        <div className="shopping-empty">
          <ShoppingCart size={48} />
          <p>No shopping lists yet.</p>
          <p>Plan some meals, then generate a list!</p>
        </div>
      ) : (
        <div className="shopping-lists">
          {lists.map((list) => (
            <div key={list.id} className="shopping-list-card">
              <div className="shopping-list-header">
                <span className="shopping-list-dates">
                  {list.startDate} to {list.endDate}
                </span>
                <div className="shopping-list-actions">
                  <span className="shopping-list-count">
                    {list.items.filter((i) => i.checked).length}/{list.items.length}
                  </span>
                  <button
                    className="shopping-list-delete"
                    onClick={() => window.confirm('Delete this list?') && deleteList(list.id)}
                    aria-label="Delete list"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <ul className="shopping-items">
                {list.items.map((item) => (
                  <li
                    key={item.id}
                    className={`shopping-item ${item.checked ? 'shopping-item--checked' : ''}`}
                    onClick={() => toggleItem(list.id, list.items, item.id)}
                  >
                    <span className="shopping-item-check">
                      {item.checked && <Check size={14} />}
                    </span>
                    <span className="shopping-item-name">{item.name}</span>
                    {item.quantity && (
                      <span className="shopping-item-qty">{item.quantity}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
