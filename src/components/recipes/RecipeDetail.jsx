import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useRecipes from '../../hooks/useRecipes';
import { useRecipeScaling } from '../../hooks/useRecipeScaling';
import { ArrowLeft, Edit, Trash2, Star, Clock } from 'lucide-react';
import './RecipeDetail.css';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { recipes, loading, deleteRecipe, toggleFavorite } = useRecipes();
  const [selectedServings, setSelectedServings] = useState(null);

  const recipe = recipes.find((r) => r.id === id);
  const baseServings = recipe?.baseServings || 2;
  const targetServings = selectedServings || baseServings;
  const { scaledRecipe, scaleFactor } = useRecipeScaling(recipe, targetServings);

  if (loading) return <div className="recipe-detail-loading">Loading...</div>;
  if (!recipe) return <div className="recipe-detail-loading">Recipe not found.</div>;

  const handleDelete = async () => {
    if (window.confirm(`Delete "${recipe.name}"?`)) {
      await deleteRecipe(id);
      navigate('/recipes');
    }
  };

  return (
    <div className="recipe-detail">
      <button className="recipe-form-back" onClick={() => navigate('/recipes')}>
        <ArrowLeft size={18} />
        <span>Recipes</span>
      </button>

      {recipe.imageUrl && (
        <div className="recipe-detail-hero">
          <img src={recipe.imageUrl} alt={recipe.name} />
        </div>
      )}

      <div className="recipe-detail-header">
        <div>
          <h2>{recipe.name}</h2>
          {recipe.description && <p className="recipe-detail-desc">{recipe.description}</p>}
        </div>
        <div className="recipe-detail-actions">
          <button
            className={`recipe-fav ${recipe.isFavorite ? 'recipe-fav--active' : ''}`}
            onClick={() => toggleFavorite(id, recipe.isFavorite)}
          >
            <Star size={20} />
          </button>
          <Link to={`/recipes/${id}/edit`} className="btn btn-secondary">
            <Edit size={16} /> Edit
          </Link>
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="recipe-detail-meta">
        <div className="recipe-serving-selector">
          <label>Serves: </label>
          <select value={selectedServings || ''} onChange={(e) => setSelectedServings(e.target.value ? Number(e.target.value) : null)}>
            <option value="">{baseServings} (original)</option>
            {[1, 2, 3, 4, 6, 8, 12].filter(s => s !== baseServings).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {scaleFactor !== 1 && <span className="recipe-scale-indicator">({scaleFactor.toFixed(1)}x)</span>}
        </div>

        {scaledRecipe?.prepTime && (
          <span><Clock size={14} /> Prep: {scaledRecipe.prepTime}m</span>
        )}
        {scaledRecipe?.cookTime && (
          <span><Clock size={14} /> Cook: {scaledRecipe.cookTime}m</span>
        )}
      </div>

      {recipe.tags?.length > 0 && (
        <div className="recipe-tags" style={{ marginBottom: 'var(--space-lg)' }}>
          {recipe.tags.map((tag) => (
            <span key={tag} className="recipe-card-tag">{tag}</span>
          ))}
        </div>
      )}

      {scaledRecipe?.ingredients?.length > 0 && (
        <div className="recipe-detail-section">
          <h3>Ingredients</h3>
          <ul className="recipe-detail-ingredients">
            {scaledRecipe.ingredients.map((ing, i) => {
              const origIng = recipe.ingredients[i];
              const hasScaled = scaleFactor !== 1 && origIng?.quantity;
              return (
                <li key={i} className={hasScaled ? 'ingredient-scaled' : ''}>
                  {ing.quantity && <strong>{ing.quantity}</strong>}
                  {ing.unit && ` ${ing.unit}`}
                  {' '}{ing.name}
                  {hasScaled && origIng?.quantity && (
                    <span className="ingredient-original">
                      {' '}(was {origIng.quantity}{origIng.unit ? ` ${origIng.unit}` : ''})
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {scaledRecipe?.instructions && (
        <div className="recipe-detail-section">
          <h3>Instructions</h3>
          <div className="recipe-detail-instructions">
            {scaledRecipe.instructions.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
