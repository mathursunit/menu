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
  const weekStart = useMemo(() => getWeekStart(new Date()), []);
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const { mealPlan } = useMealPlan(weekStart, 'week');
  const { recipes } = useRecipes();
  const { lists, loading, createList, toggleItem, deleteList } = useShoppingList();

  const [generating, setGenerating] = useState(false);

  const generateList = async () => {
    setGenerating(true);
    try {
      // Get all recipe IDs from the current week's meal plan
      const recipeIds = new Set();
      weekDates.forEach((dateId) => {
        const dayPlan = mealPlan[dateId];
        if (!dayPlan?.meals) return;
        MEAL_TYPES.forEach((type) => {
          const meal = dayPlan.meals[type];
          if (meal?.recipeId) recipeIds.add(meal.recipeId);
        });
      });

      // Get full recipes for those IDs
      const plannedRecipes = recipes.filter((r) => recipeIds.has(r.id));
      const items = consolidateIngredients(plannedRecipes);

      if (items.length === 0) {
        alert('No meals planned for this week, or planned meals have no ingredients.');
        return;
      }

      const startDate = weekDates[0];
      const endDate = weekDates[6];
      await createList(startDate, endDate, items);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="shopping-page">
      <div className="shopping-header">
        <h2>Shopping Lists</h2>
        <button className="btn btn-primary" onClick={generateList} disabled={generating}>
          <Plus size={18} />
          <span>{generating ? 'Generating...' : `Generate for ${formatWeekRange(weekStart)}`}</span>
        </button>
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
