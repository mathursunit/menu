import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useRecipes from '../../hooks/useRecipes';
import { RECIPE_TAGS, UNIT_OPTIONS } from '../../utils/constants';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import './RecipeForm.css';

const emptyIngredient = { name: '', quantity: '', unit: '' };

export default function RecipeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { recipes, addRecipe, updateRecipe } = useRecipes();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    description: '',
    instructions: '',
    prepTime: '',
    cookTime: '',
    imageUrl: '',
    tags: [],
    ingredients: [{ ...emptyIngredient }],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && recipes.length > 0) {
      const recipe = recipes.find((r) => r.id === id);
      if (recipe) {
        setForm({
          name: recipe.name || '',
          description: recipe.description || '',
          instructions: recipe.instructions || '',
          prepTime: recipe.prepTime || '',
          cookTime: recipe.cookTime || '',
          imageUrl: recipe.imageUrl || '',
          tags: recipe.tags || [],
          ingredients: recipe.ingredients?.length
            ? recipe.ingredients
            : [{ ...emptyIngredient }],
        });
      }
    }
  }, [id, isEdit, recipes]);

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const updateIngredient = (index, field, value) => {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      ),
    }));
  };

  const addIngredient = () => {
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, { ...emptyIngredient }] }));
  };

  const removeIngredient = (index) => {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.filter((_, i) => i !== index),
    }));
  };

  const toggleTag = (tag) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    const data = {
      ...form,
      prepTime: form.prepTime ? Number(form.prepTime) : null,
      cookTime: form.cookTime ? Number(form.cookTime) : null,
      ingredients: form.ingredients.filter((ing) => ing.name.trim()),
    };

    try {
      if (isEdit) {
        await updateRecipe(id, data);
        navigate(`/recipes/${id}`);
      } else {
        const docRef = await addRecipe(data);
        navigate(`/recipes/${docRef.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="recipe-form-page">
      <button className="recipe-form-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <h2>{isEdit ? 'Edit Recipe' : 'New Recipe'}</h2>

      <form className="recipe-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Recipe Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="e.g., Chicken Tikka Masala"
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Brief description..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Prep Time (min)</label>
            <input
              type="number"
              value={form.prepTime}
              onChange={(e) => updateField('prepTime', e.target.value)}
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Cook Time (min)</label>
            <input
              type="number"
              value={form.cookTime}
              onChange={(e) => updateField('cookTime', e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Image URL</label>
          <input
            type="url"
            value={form.imageUrl}
            onChange={(e) => updateField('imageUrl', e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="form-group">
          <label>Ingredients</label>
          <div className="ingredients-list">
            {form.ingredients.map((ing, i) => (
              <div key={i} className="ingredient-row">
                <input
                  type="text"
                  placeholder="Ingredient"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                  className="ingredient-name"
                />
                <input
                  type="text"
                  placeholder="Qty"
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                  className="ingredient-qty"
                />
                <select
                  value={ing.unit}
                  onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                  className="ingredient-unit"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>{u || '—'}</option>
                  ))}
                </select>
                {form.ingredients.length > 1 && (
                  <button type="button" className="ingredient-remove" onClick={() => removeIngredient(i)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-secondary" onClick={addIngredient}>
            <Plus size={14} /> Add Ingredient
          </button>
        </div>

        <div className="form-group">
          <label>Instructions</label>
          <textarea
            value={form.instructions}
            onChange={(e) => updateField('instructions', e.target.value)}
            placeholder="Step-by-step instructions..."
            rows={6}
          />
        </div>

        <div className="form-group">
          <label>Tags</label>
          <div className="recipe-tags">
            {RECIPE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`recipe-tag ${form.tags.includes(tag) ? 'recipe-tag--active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Recipe' : 'Add Recipe'}
          </button>
        </div>
      </form>
    </div>
  );
}
