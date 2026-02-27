import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useMealPlan from '../../hooks/useMealPlan';
import CalendarNav from './CalendarNav';
import { getWeekStart, getMonthDates, addWeeks, formatDate, formatMonthYear, getDayName, getDayNumber, isToday } from '../../utils/dates';
import { MEAL_TYPES } from '../../utils/constants';
import { CalendarDays } from 'lucide-react';
import './MonthView.css';

export default function MonthView() {
  const { monthStart: monthParam } = useParams();
  const navigate = useNavigate();

  const startDate = useMemo(() => {
    if (monthParam) return new Date(monthParam + 'T00:00:00');
    return getWeekStart(new Date());
  }, [monthParam]);

  const monthDates = useMemo(() => getMonthDates(startDate), [startDate]);
  const { mealPlan, loading } = useMealPlan(startDate, 'month');

  const goTo = (date) => navigate(`/calendar/month/${formatDate(date)}`);

  const weeks = [];
  for (let i = 0; i < 28; i += 7) {
    weeks.push(monthDates.slice(i, i + 7));
  }

  return (
    <div className="month-view">
      <div className="month-view-header">
        <CalendarNav
          label={formatMonthYear(startDate)}
          onPrev={() => goTo(addWeeks(startDate, -4))}
          onNext={() => goTo(addWeeks(startDate, 4))}
          onToday={() => navigate('/calendar/month')}
        />
        <Link to="/calendar" className="view-toggle-link">
          <CalendarDays size={18} />
          <span>Week</span>
        </Link>
      </div>

      {loading ? (
        <div className="month-view-loading">Loading...</div>
      ) : (
        <div className="month-grid">
          <div className="month-grid-header">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="month-grid-day-label">{d}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="month-grid-week">
              {week.map((dateId) => {
                const dayPlan = mealPlan[dateId];
                const mealCount = MEAL_TYPES.filter((t) => dayPlan?.meals?.[t]?.recipeId).length;
                const cookedCount = MEAL_TYPES.filter((t) => dayPlan?.meals?.[t]?.isCooked).length;
                const today = isToday(dateId);

                return (
                  <Link
                    key={dateId}
                    to={`/calendar/week/${formatDate(getWeekStart(new Date(dateId + 'T00:00:00')))}`}
                    className={`month-grid-cell ${today ? 'month-grid-cell--today' : ''}`}
                  >
                    <span className="month-cell-day">{getDayNumber(dateId)}</span>
                    {mealCount > 0 && (
                      <div className="month-cell-dots">
                        {MEAL_TYPES.map((t) => {
                          const m = dayPlan?.meals?.[t];
                          if (!m?.recipeId) return <span key={t} className="month-dot month-dot--empty" />;
                          return (
                            <span
                              key={t}
                              className={`month-dot ${m.isCooked ? 'month-dot--cooked' : 'month-dot--planned'}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
