const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Returns a Date set to midnight local time for a given date string "YYYY-MM-DD"
export function parseDate(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Format a Date to "YYYY-MM-DD"
export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Get the Monday of the week containing the given date
export function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  d.setDate(d.getDate() + diff);
  return d;
}

// Get array of 7 date strings for the week starting at weekStart
export function getWeekDates(weekStart) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}

// Get array of 28 date strings (4 weeks) starting from a Monday
export function getMonthDates(startDate) {
  const dates = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}

// Add days to a date
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Add weeks to a date
export function addWeeks(date, weeks) {
  return addDays(date, weeks * 7);
}

// Check if a date string is today
export function isToday(dateString) {
  return dateString === formatDate(new Date());
}

// Check if a date is in the past
export function isPast(dateString) {
  return dateString < formatDate(new Date());
}

// Format for display: "Mon, Feb 27"
export function formatShort(dateString) {
  const date = parseDate(dateString);
  return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

// Format for display: "Monday, February 27"
export function formatLong(dateString) {
  const date = parseDate(dateString);
  return `${DAY_NAMES_FULL[date.getDay()]}, ${MONTH_NAMES_FULL[date.getMonth()]} ${date.getDate()}`;
}

// Format week range: "Feb 24 - Mar 2, 2026"
export function formatWeekRange(weekStart) {
  const start = typeof weekStart === 'string' ? parseDate(weekStart) : weekStart;
  const end = addDays(start, 6);
  const startMonth = MONTH_NAMES[start.getMonth()];
  const endMonth = MONTH_NAMES[end.getMonth()];
  const year = end.getFullYear();

  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`;
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
}

// Format month label: "February 2026"
export function formatMonthYear(date) {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return `${MONTH_NAMES_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

// Get day name: "Mon"
export function getDayName(dateString) {
  return DAY_NAMES[parseDate(dateString).getDay()];
}

// Get day number: 27
export function getDayNumber(dateString) {
  return parseDate(dateString).getDate();
}
