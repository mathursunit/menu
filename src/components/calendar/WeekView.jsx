import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useMealPlan from '../../hooks/useMealPlan';
import useRecipes from '../../hooks/useRecipes';
import DayColumn from './DayColumn';
import CalendarNav from './CalendarNav';
import RecipePicker from './RecipePicker';
import { MealPlannerModal } from '../meals/MealPlannerModal';
import { getWeekStart, getWeekDates, addWeeks, formatDate, formatWeekRange } from '../../utils/dates';
import { CalendarRange, Sparkles } from 'lucide-react';
import './WeekView.css';

export default function WeekView() {
  const { weekStart: weekParam } = useParams();
  const navigate = useNavigate();

  const weekStart = useMemo(() => {
    if (weekParam) return new Date(weekParam + 'T00:00:00');
    return getWeekStart(new Date());
  }, [weekParam]);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const { mealPlan, loading, assignMeal, removeMeal, toggleCooked, setMealPhoto } = useMealPlan(weekStart, 'week');
  const { recipes } = useRecipes();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null);
  const [plannerOpen, setPlannerOpen] = useState(false);

  const goToWeek = (date) => {
    navigate(`/calendar/week/${formatDate(date)}`);
  };

  const handleSlotClick = (dateId, mealType) => {
    setPickerTarget({ dateId, mealType });
    setPickerOpen(true);
  };

  const handleRecipeSelect = async (recipe) => {
    if (pickerTarget) {
      await assignMeal(pickerTarget.dateId, pickerTarget.mealType, recipe);
      setPickerOpen(false);
      setPickerTarget(null);
    }
  };

  return (
    <div className="week-view">
      <div className="week-view-header">
        <CalendarNav
          label={formatWeekRange(weekStart)}
          onPrev={() => goToWeek(addWeeks(weekStart, -1))}
          onNext={() => goToWeek(addWeeks(weekStart, 1))}
          onToday={() => navigate('/calendar')}
        />
        <div className="week-view-actions">
          <button
            className="btn-generate-week"
            onClick={() => setPlannerOpen(true)}
            title="Generate weekly meal plan with AI"
          >
            <Sparkles size={18} />
            <span>Generate Week</span>
          </button>
          <Link to="/calendar/month" className="view-toggle-link">
            <CalendarRange size={18} />
            <span>Month</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="week-view-loading">Loading plan...</div>
      ) : (
        <div className="week-grid">
          {weekDates.map((dateId) => (
            <DayColumn
              key={dateId}
              dateId={dateId}
              dayPlan={mealPlan[dateId]}
              onSlotClick={handleSlotClick}
              onRemoveMeal={removeMeal}
              onToggleCooked={toggleCooked}
              onSetPhoto={setMealPhoto}
            />
          ))}
        </div>
      )}

      {pickerOpen && (
        <RecipePicker
          recipes={recipes}
          onSelect={handleRecipeSelect}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <MealPlannerModal isOpen={plannerOpen} onClose={() => setPlannerOpen(false)} />
    </div>
  );
}
