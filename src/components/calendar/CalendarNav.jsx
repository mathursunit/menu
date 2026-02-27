import { ChevronLeft, ChevronRight } from 'lucide-react';
import './CalendarNav.css';

export default function CalendarNav({ label, onPrev, onNext, onToday }) {
  return (
    <div className="calendar-nav">
      <button className="calendar-nav-btn" onClick={onPrev} aria-label="Previous">
        <ChevronLeft size={20} />
      </button>
      <div className="calendar-nav-center">
        <span className="calendar-nav-label">{label}</span>
        <button className="calendar-nav-today" onClick={onToday}>
          Today
        </button>
      </div>
      <button className="calendar-nav-btn" onClick={onNext} aria-label="Next">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
