import { NavLink } from 'react-router-dom';
import { CalendarDays, UtensilsCrossed, ShoppingCart, ChefHat } from 'lucide-react';
import './BottomNav.css';

const NAV_ITEMS = [
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/recipes', icon: UtensilsCrossed, label: 'Recipes' },
  { to: '/shopping', icon: ShoppingCart, label: 'Shopping' },
  { to: '/stats', icon: ChefHat, label: 'Tracker' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} className="bottom-nav-link">
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
