import MealSlot from './MealSlot';
import { MEAL_TYPES, MEAL_LABELS } from '../../utils/constants';
import { getDayName, getDayNumber, isToday, isPast } from '../../utils/dates';
import './DayColumn.css';

export default function DayColumn({ dateId, dayPlan, onSlotClick, onRemoveMeal, onToggleCooked, onSetPhoto }) {
  const today = isToday(dateId);
  const past = isPast(dateId);

  return (
    <div className={`day-column ${today ? 'day-column--today' : ''} ${past ? 'day-column--past' : ''}`}>
      <div className="day-column-header">
        <span className="day-column-name">{getDayName(dateId)}</span>
        <span className={`day-column-number ${today ? 'day-column-number--today' : ''}`}>
          {getDayNumber(dateId)}
        </span>
      </div>
      <div className="day-column-meals">
        {MEAL_TYPES.map((type) => {
          const meal = dayPlan?.meals?.[type];
          return (
            <MealSlot
              key={type}
              dateId={dateId}
              mealType={type}
              label={MEAL_LABELS[type]}
              meal={meal}
              onSlotClick={() => onSlotClick(dateId, type)}
              onRemove={() => onRemoveMeal(dateId, type)}
              onToggleCooked={() => meal && onToggleCooked(dateId, type, meal)}
              onSetPhoto={onSetPhoto}
            />
          );
        })}
      </div>
    </div>
  );
}
