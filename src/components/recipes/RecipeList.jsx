import { useState } from 'react';
import { Link } from 'react-router-dom';
import useRecipes from '../../hooks/useRecipes';
import { Search, Plus, Star, Clock } from 'lucide-react';
import { RECIPE_TAGS } from '../../utils/constants';
import './RecipeList.css';

export default function RecipeList() {
  const { recipes, loading, toggleFavorite } = useRecipes();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);

  const filtered = recipes.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !activeTag || r.tags?.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  const sorted = [...filtered].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));

  // Get tags that are actually used
  const usedTags = [...new Set(recipes.flatMap((r) => r.tags || []))].sort();

  return (
    <div className="recipe-list">
      <div className="recipe-list-header">
        <h2>Recipes</h2>
        <Link to="/recipes/new" className="btn btn-primary">
          <Plus size={18} />
          <span>Add Recipe</span>
        </Link>
      </div>

      <div className="recipe-search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {usedTags.length > 0 && (
        <div className="recipe-tags">
          <button
            className={`recipe-tag ${!activeTag ? 'recipe-tag--active' : ''}`}
            onClick={() => setActiveTag(null)}
          >
            All
          </button>
          {usedTags.map((tag) => (
            <button
              key={tag}
              className={`recipe-tag ${activeTag === tag ? 'recipe-tag--active' : ''}`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="recipe-list-empty">Loading recipes...</p>
      ) : sorted.length === 0 ? (
        <div className="recipe-list-empty">
          <p>No recipes yet. Add your first one!</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {sorted.map((recipe) => (
            <div key={recipe.id} className="recipe-card">
              {recipe.imageUrl && (
                <Link to={`/recipes/${recipe.id}`} className="recipe-card-image">
                  <img src={recipe.imageUrl} alt={recipe.name} />
                </Link>
              )}
              <div className="recipe-card-body">
                <div className="recipe-card-top">
                  <Link to={`/recipes/${recipe.id}`} className="recipe-card-name">
                    {recipe.name}
                  </Link>
                  <button
                    className={`recipe-fav ${recipe.isFavorite ? 'recipe-fav--active' : ''}`}
                    onClick={() => toggleFavorite(recipe.id, recipe.isFavorite)}
                    aria-label={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star size={16} />
                  </button>
                </div>
                {recipe.description && (
                  <p className="recipe-card-desc">{recipe.description}</p>
                )}
                <div className="recipe-card-meta">
                  {recipe.prepTime && (
                    <span className="recipe-card-time">
                      <Clock size={12} /> {recipe.prepTime}m
                    </span>
                  )}
                  {recipe.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="recipe-card-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
