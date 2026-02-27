import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeSwitcher from '../common/ThemeSwitcher';
import { CalendarDays, UtensilsCrossed, ShoppingCart, ChefHat, LogOut } from 'lucide-react';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-logo">
          <UtensilsCrossed size={22} />
          <span>SunSar Menu</span>
        </h1>
      </div>

      <nav className="header-nav" aria-label="Main navigation">
        <NavLink to="/calendar" className="header-nav-link">
          <CalendarDays size={18} />
          <span>Calendar</span>
        </NavLink>
        <NavLink to="/recipes" className="header-nav-link">
          <UtensilsCrossed size={18} />
          <span>Recipes</span>
        </NavLink>
        <NavLink to="/shopping" className="header-nav-link">
          <ShoppingCart size={18} />
          <span>Shopping</span>
        </NavLink>
        <NavLink to="/stats" className="header-nav-link">
          <ChefHat size={18} />
          <span>Tracker</span>
        </NavLink>
      </nav>

      <div className="header-right">
        <ThemeSwitcher />
        {user?.photoURL && (
          <img src={user.photoURL} alt="" className="header-avatar" />
        )}
        <button onClick={logout} className="header-logout" aria-label="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
