import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useRecipes from '../../hooks/useRecipes';
import { useRecipeImageParser } from '../../hooks/useRecipeImageParser';
import { RECIPE_TAGS, UNIT_OPTIONS } from '../../utils/constants';
import { parseIngredients } from '../../utils/ingredientParser';
import { Plus, Trash2, ArrowLeft, ClipboardPaste, CheckCheck, X, Camera, Loader2 } from 'lucide-react';
import './RecipeForm.css';

const emptyIngredient = { name: '', quantity: '', unit: '' };

export default function RecipeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { recipes, addRecipe, updateRecipe } = useRecipes();
  const { parseImage, analyzing, analyzeError } = useRecipeImageParser();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    description: '',
    instructions: '',
    prepTime: '',
    cookTime: '',
    baseServings: 2,
    imageUrl: '',
    tags: [],
    ingredients: [{ ...emptyIngredient }],
  });
  const [saving, setSaving] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // Paste & parse panel state
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const pasteRef   = useRef(null);
  const photoInput = useRef(null);

  // Live-preview of pasted text
  const parsedPreview = parseIngredients(pasteText);

  useEffect(() => {
    if (isEdit && recipes.length > 0) {
      const recipe = recipes.find((r) => r.id === id);
      if (recipe) {
        setForm({
          name:         recipe.name         || '',
          description:  recipe.description  || '',
          instructions: recipe.instructions || '',
          prepTime:     recipe.prepTime     || '',
          cookTime:     recipe.cookTime     || '',
          baseServings: recipe.baseServings || 2,
          imageUrl:     recipe.imageUrl     || '',
          tags:         recipe.tags         || [],
          ingredients:  recipe.ingredients?.length
            ? recipe.ingredients
            : [{ ...emptyIngredient }],
        });
      }
    }
  }, [id, isEdit, recipes]);

  // Focus paste textarea when panel opens
  useEffect(() => {
    if (pasteOpen && pasteRef.current) pasteRef.current.focus();
  }, [pasteOpen]);

  const updateField = (field, value) =>
    setForm((f) => ({ ...f, [field]: value }));

  const updateIngredient = (index, field, value) =>
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      ),
    }));

  const addIngredient = () =>
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, { ...emptyIngredient }] }));

  const removeIngredient = (index) =>
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.filter((_, i) => i !== index),
    }));

  const toggleTag = (tag) =>
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter((t) => t !== tag)
        : [...f.tags, tag],
    }));

  // ── Photo import ───────────────────────────────────────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected after an error
    e.target.value = '';

    const extracted = await parseImage(file);
    if (!extracted) return;

    setForm((f) => ({
      ...f,
      name:         extracted.name         || f.name,
      description:  extracted.description  || f.description,
      prepTime:     extracted.prepTime     !== '' ? extracted.prepTime  : f.prepTime,
      cookTime:     extracted.cookTime     !== '' ? extracted.cookTime  : f.cookTime,
      instructions: extracted.instructions || f.instructions,
      tags:         extracted.tags.length  ? extracted.tags             : f.tags,
      ingredients:  extracted.ingredients.length
        ? extracted.ingredients
        : f.ingredients,
    }));

    setImportSuccess(true);
    setTimeout(() => setImportSuccess(false), 3000);
  };

  // ── Paste & parse ──────────────────────────────────────────────────────────
  const handleAddParsed = () => {
    if (parsedPreview.length === 0) return;
    setForm((f) => {
      const existing = f.ingredients.filter((ing) => ing.name.trim());
      return { ...f, ingredients: [...existing, ...parsedPreview] };
    });
    setPasteText('');
    setPasteOpen(false);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    const data = {
      ...form,
      baseServings: Number(form.baseServings) || 2,
      prepTime:    form.prepTime    ? Number(form.prepTime)    : null,
      cookTime:    form.cookTime    ? Number(form.cookTime)    : null,
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="recipe-form-page">
      <button className="recipe-form-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <h2>{isEdit ? 'Edit Recipe' : 'New Recipe'}</h2>

      {/* ── Photo import strip ─────────────────────────────────────────── */}
      <div className="photo-import-strip">
        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          className="photo-import-input"
          onChange={handlePhotoChange}
        />

        <button
          type="button"
          className={`photo-import-btn ${analyzing ? 'photo-import-btn--analyzing' : ''} ${importSuccess ? 'photo-import-btn--success' : ''}`}
          onClick={() => photoInput.current?.click()}
          disabled={analyzing}
        >
          {analyzing ? (
            <>
              <Loader2 size={16} className="spin" />
              <span>Reading recipe…</span>
            </>
          ) : importSuccess ? (
            <>
              <CheckCheck size={16} />
              <span>Recipe imported!</span>
            </>
          ) : (
            <>
              <Camera size={16} />
              <span>Import from photo</span>
            </>
          )}
        </button>

        <span className="photo-import-hint">
          {analyzing
            ? 'Gemini is scanning the image…'
            : 'Paste a screenshot of any recipe and auto-fill this form'}
        </span>

        {analyzeError && (
          <p className="photo-import-error">{analyzeError}</p>
        )}
      </div>

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
            placeholder="Brief description…"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Base Servings</label>
            <input
              type="number"
              value={form.baseServings}
              onChange={(e) => updateField('baseServings', e.target.value)}
              min="1"
              max="12"
              placeholder="2"
            />
          </div>
          <div className="form-group">
            <label>Prep Time (min)</label>
            <input
              type="number"
              value={form.prepTime}
              onChange={(e) => updateField('prepTime', e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Cook Time (min)</label>
            <input
              type="number"
              value={form.cookTime}
              onChange={(e) => updateField('cookTime', e.target.value)}
              min="0"
            />
          </div>
          <div className="form-group">
            <label>&nbsp;</label>
            <div style={{ opacity: 0 }}>-</div>
          </div>
        </div>

        <div className="form-group">
          <label>Image URL</label>
          <input
            type="url"
            value={form.imageUrl}
            onChange={(e) => updateField('imageUrl', e.target.value)}
            placeholder="https://…"
          />
        </div>

        {/* ── Ingredients ──────────────────────────────────────────────── */}
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
                  <button
                    type="button"
                    className="ingredient-remove"
                    onClick={() => removeIngredient(i)}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="ingredient-actions">
            <button type="button" className="btn btn-secondary" onClick={addIngredient}>
              <Plus size={14} /> Add Ingredient
            </button>
            <button
              type="button"
              className={`btn btn-secondary paste-toggle-btn ${pasteOpen ? 'paste-toggle-btn--active' : ''}`}
              onClick={() => { setPasteOpen((o) => !o); setPasteText(''); }}
            >
              <ClipboardPaste size={14} />
              Paste &amp; Parse
            </button>
          </div>

          {/* ── Paste panel ─────────────────────────────────────────────── */}
          {pasteOpen && (
            <div className="paste-panel">
              <div className="paste-panel-header">
                <span className="paste-panel-title">Paste ingredient list</span>
                <button
                  type="button"
                  className="paste-panel-close"
                  onClick={() => { setPasteOpen(false); setPasteText(''); }}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="paste-panel-body">
                <div className="paste-input-col">
                  <textarea
                    ref={pasteRef}
                    className="paste-textarea"
                    placeholder={`Paste one ingredient per line, e.g.\n\n3 Large Eggs\n2 slices Smoked Bacon (chopped)\n1/2 cup Mushrooms (sliced)\n1 tbsp Mayonnaise\n1 pinch Salt`}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    rows={8}
                    spellCheck={false}
                  />
                </div>

                {parsedPreview.length > 0 && (
                  <div className="paste-preview-col">
                    <p className="paste-preview-label">
                      {parsedPreview.length} ingredient{parsedPreview.length !== 1 ? 's' : ''} detected
                    </p>
                    <ul className="paste-preview-list">
                      {parsedPreview.map((ing, i) => (
                        <li key={i} className="paste-preview-item">
                          <span className="paste-preview-qty">
                            {ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}
                          </span>
                          <span className="paste-preview-name">{ing.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="paste-panel-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setPasteOpen(false); setPasteText(''); }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddParsed}
                  disabled={parsedPreview.length === 0}
                >
                  <CheckCheck size={14} />
                  Add {parsedPreview.length > 0 ? parsedPreview.length : ''} Ingredient{parsedPreview.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Instructions</label>
          <textarea
            value={form.instructions}
            onChange={(e) => updateField('instructions', e.target.value)}
            placeholder="Step-by-step instructions…"
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
            {saving ? 'Saving…' : isEdit ? 'Update Recipe' : 'Add Recipe'}
          </button>
        </div>
      </form>
    </div>
  );
}
