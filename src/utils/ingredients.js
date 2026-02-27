// Consolidate ingredients from multiple recipes into a shopping list
export function consolidateIngredients(recipes) {
  const map = new Map();

  recipes.forEach((recipe) => {
    if (!recipe?.ingredients) return;

    recipe.ingredients.forEach((ing) => {
      const key = normalizeIngredientName(ing.name);
      if (!key) return;

      if (map.has(key)) {
        const existing = map.get(key);
        if (ing.unit && ing.unit === existing.unit && isNumeric(ing.quantity) && isNumeric(existing.rawQty)) {
          existing.rawQty = parseFloat(existing.rawQty) + parseFloat(ing.quantity);
          existing.quantity = `${existing.rawQty} ${existing.unit}`.trim();
        } else {
          // Different units or non-numeric — append
          existing.quantity += `, ${formatQuantity(ing)}`;
        }
      } else {
        map.set(key, {
          name: ing.name.trim(),
          quantity: formatQuantity(ing),
          rawQty: ing.quantity,
          unit: ing.unit || '',
        });
      }
    });
  });

  return Array.from(map.values()).map(({ name, quantity }) => ({ name, quantity }));
}

function normalizeIngredientName(name) {
  return (name || '').trim().toLowerCase().replace(/s$/, '');
}

function formatQuantity(ing) {
  const qty = ing.quantity || '';
  const unit = ing.unit || '';
  return `${qty} ${unit}`.trim() || '';
}

function isNumeric(val) {
  return !isNaN(parseFloat(val)) && isFinite(val);
}
