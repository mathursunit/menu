import { useMemo } from 'react';
import useMealPlan from '../../hooks/useMealPlan';
import useCookingStats from '../../hooks/useCookingStats';
import { getWeekStart, getWeekDates, getMonthDates, formatWeekRange, formatDate, addWeeks } from '../../utils/dates';
import { MEAL_TYPES, MEAL_LABELS } from '../../utils/constants';
import { ChefHat, Flame, TrendingUp, Camera } from 'lucide-react';
import './CookingTracker.css';

export default function CookingTracker() {
  const weekStart = useMemo(() => getWeekStart(new Date()), []);
  const monthStart = useMemo(() => addWeeks(weekStart, -3), [weekStart]);

  const { mealPlan: weekPlan } = useMealPlan(weekStart, 'week');
  const { mealPlan: monthPlan } = useMealPlan(monthStart, 'month');

  const weekStats = useCookingStats(weekPlan);
  const monthStats = useCookingStats(monthPlan);

  // Collect all photos from the month
  const photos = useMemo(() => {
    const result = [];
    Object.entries(monthPlan).forEach(([dateId, dayPlan]) => {
      if (!dayPlan?.meals) return;
      MEAL_TYPES.forEach((type) => {
        const meal = dayPlan.meals[type];
        if (meal?.photoUrl) {
          result.push({
            dateId,
            mealType: type,
            recipeName: meal.recipeName,
            photoUrl: meal.photoUrl,
          });
        }
      });
    });
    return result.sort((a, b) => b.dateId.localeCompare(a.dateId));
  }, [monthPlan]);

  return (
    <div className="tracker-page">
      <h2>Cooking Tracker</h2>

      <div className="tracker-stats">
        <div className="stat-card">
          <div className="stat-icon"><Flame size={24} /></div>
          <div className="stat-value">{weekStats.totalCooked}</div>
          <div className="stat-label">Cooked this week</div>
          <div className="stat-sub">{weekStats.totalPlanned} planned</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={24} /></div>
          <div className="stat-value">{monthStats.totalCooked}</div>
          <div className="stat-label">Cooked this month</div>
          <div className="stat-sub">{monthStats.totalPlanned} planned</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><ChefHat size={24} /></div>
          <div className="stat-value">
            {weekStats.totalPlanned > 0
              ? Math.round((weekStats.totalCooked / weekStats.totalPlanned) * 100)
              : 0}%
          </div>
          <div className="stat-label">Weekly rate</div>
        </div>
      </div>

      {weekStats.totalCooked > 0 && (
        <div className="tracker-section">
          <h3>This Week by Meal</h3>
          <div className="tracker-meals">
            {MEAL_TYPES.map((type) => (
              <div key={type} className="tracker-meal-row">
                <span className="tracker-meal-label">{MEAL_LABELS[type]}</span>
                <div className="tracker-meal-bar-bg">
                  <div
                    className="tracker-meal-bar"
                    style={{ width: `${(weekStats.mealsByType[type] / 7) * 100}%` }}
                  />
                </div>
                <span className="tracker-meal-count">{weekStats.mealsByType[type]}/7</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {photos.length > 0 && (
        <div className="tracker-section">
          <h3><Camera size={18} /> Meal Photos</h3>
          <div className="tracker-photos">
            {photos.map((photo, i) => (
              <div key={i} className="tracker-photo">
                <img src={photo.photoUrl} alt={photo.recipeName} />
                <div className="tracker-photo-info">
                  <span className="tracker-photo-name">{photo.recipeName}</span>
                  <span className="tracker-photo-date">{photo.dateId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
