import { useState } from 'react';
import Modal from '../common/Modal';
import { Search, Star } from 'lucide-react';
import './RecipePicker.css';

export default function RecipePicker({ recipes, onSelect, onClose }) {
  const [search, setSearch] = useState('');

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  // Sort favorites first
  const sorted = [...filtered].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));

  return (
    <Modal isOpen onClose={onClose} title="Pick a Recipe">
      <div className="recipe-picker">
        <div className="recipe-picker-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="recipe-picker-list">
          {sorted.length === 0 ? (
            <p className="recipe-picker-empty">No recipes found. Add some first!</p>
          ) : (
            sorted.map((recipe) => (
              <button
                key={recipe.id}
                className="recipe-picker-item"
                onClick={() => onSelect(recipe)}
              >
                <span className="recipe-picker-name">{recipe.name}</span>
                {recipe.isFavorite && <Star size={14} className="recipe-picker-star" />}
                {recipe.prepTime && (
                  <span className="recipe-picker-time">{recipe.prepTime}m</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
