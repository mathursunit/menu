import { useTheme } from '../../contexts/ThemeContext';
import { Palette } from 'lucide-react';
import './ThemeSwitcher.css';

export default function ThemeSwitcher() {
  const { theme, setTheme, themes, themeLabels } = useTheme();

  return (
    <div className="theme-switcher">
      <Palette size={18} />
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        aria-label="Select theme"
      >
        {themes.map((t) => (
          <option key={t} value={t}>
            {themeLabels[t]}
          </option>
        ))}
      </select>
    </div>
  );
}
