import { useParams, useNavigate, Link } from 'react-router-dom';
import useRecipes from '../../hooks/useRecipes';
import { ArrowLeft, Edit, Trash2, Star, Clock } from 'lucide-react';
import './RecipeDetail.css';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { recipes, loading, deleteRecipe, toggleFavorite } = useRecipes();

  const recipe = recipes.find((r) => r.id === id);

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
        {recipe.prepTime && (
          <span><Clock size={14} /> Prep: {recipe.prepTime}m</span>
        )}
        {recipe.cookTime && (
          <span><Clock size={14} /> Cook: {recipe.cookTime}m</span>
        )}
      </div>

      {recipe.tags?.length > 0 && (
        <div className="recipe-tags" style={{ marginBottom: 'var(--space-lg)' }}>
          {recipe.tags.map((tag) => (
            <span key={tag} className="recipe-card-tag">{tag}</span>
          ))}
        </div>
      )}

      {recipe.ingredients?.length > 0 && (
        <div className="recipe-detail-section">
          <h3>Ingredients</h3>
          <ul className="recipe-detail-ingredients">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                {ing.quantity && <strong>{ing.quantity}</strong>}
                {ing.unit && ` ${ing.unit}`}
                {' '}{ing.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recipe.instructions && (
        <div className="recipe-detail-section">
          <h3>Instructions</h3>
          <div className="recipe-detail-instructions">
            {recipe.instructions.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
