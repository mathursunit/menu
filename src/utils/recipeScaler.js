/**
 * Recipe Scaling Utilities
 * Handles ingredient quantity scaling for different serving sizes
 */

// ──────────────────────────────────────────────────────────────────────────
// FRACTION PARSING & STRINGIFY
// ──────────────────────────────────────────────────────────────────────────

/**
 * Parse a quantity string like "1 1/2" or "1/2" into a decimal number
 * @param {string} quantityStr - e.g., "1 1/2", "1/2", "3", "0.5"
 * @returns {number} - decimal value
 */
export function parseQuantity(quantityStr) {
  if (!quantityStr || typeof quantityStr !== 'string') return 0;

  const trimmed = quantityStr.trim();

  // Check for unicode fractions first
  const unicodeFractionMap = {
    '½': 0.5, '⅓': 1/3, '⅔': 2/3,
    '¼': 0.25, '¾': 0.75,
    '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
    '⅙': 1/6, '⅚': 5/6,
    '⅐': 1/7, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
    '⅑': 1/9, '⅔': 2/3
  };

  // Replace unicode fractions
  let normalized = trimmed;
  Object.entries(unicodeFractionMap).forEach(([unicode, decimal]) => {
    normalized = normalized.replace(new RegExp(unicode, 'g'), String(decimal));
  });

  // Handle mixed numbers: "1 1/2" → 1 + 0.5 = 1.5
  const mixedMatch = normalized.match(/^(\d+(?:\.\d+)?)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1]);
    const num = parseFloat(mixedMatch[2]);
    const denom = parseFloat(mixedMatch[3]);
    return whole + (num / denom);
  }

  // Handle fractions: "1/2" → 0.5
  const fracMatch = normalized.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const denom = parseFloat(fracMatch[2]);
    return num / denom;
  }

  // Handle decimals: "1.5" → 1.5
  const decimal = parseFloat(normalized);
  return isNaN(decimal) ? 0 : decimal;
}

/**
 * Convert a decimal quantity to a readable fraction/mixed number string
 * @param {number} decimal - e.g., 1.5, 0.333, 0.125
 * @returns {string} - e.g., "1 1/2", "1/3", "1/8"
 */
export function stringifyQuantity(decimal) {
  if (!Number.isFinite(decimal)) return '0';
  if (decimal === 0) return '0';

  // Round to avoid floating point errors
  const rounded = Math.round(decimal * 1000) / 1000;

  // Common fractions to check (ordered by denominator preference)
  const fractions = [
    [1, 1], [1, 2], [1, 3], [2, 3],
    [1, 4], [3, 4],
    [1, 5], [2, 5], [3, 5], [4, 5],
    [1, 6], [5, 6],
    [1, 8], [3, 8], [5, 8], [7, 8],
  ];

  const whole = Math.floor(rounded);
  const remainder = rounded - whole;

  // Find closest fraction match for remainder
  let bestFraction = null;
  let bestError = 0.01; // tolerance

  for (const [num, denom] of fractions) {
    const value = num / denom;
    const error = Math.abs(value - remainder);
    if (error < bestError) {
      bestError = error;
      bestFraction = [num, denom];
    }
  }

  // Build result
  if (bestFraction && remainder > 0.05) {
    // Has fractional part
    const [num, denom] = bestFraction;
    if (whole > 0) {
      return `${whole} ${num}/${denom}`;
    } else {
      return `${num}/${denom}`;
    }
  } else if (whole > 0) {
    // Just whole number
    return String(whole);
  } else {
    // Very small, round up
    return '0.5';
  }
}

// ──────────────────────────────────────────────────────────────────────────
// UNIT CONVERSION
// ──────────────────────────────────────────────────────────────────────────

// Define unit conversion ratios to a base unit (milliliters for volume, grams for weight)
const UNIT_CONVERSIONS = {
  // Volume (to ml)
  'ml': 1,
  'cup': 237,
  'cups': 237,
  'tbsp': 15,
  'tsp': 5,
  'tablespoon': 15,
  'teaspoon': 5,

  // Weight (to g)
  'g': 1,
  'oz': 28.35,
  'lb': 453.6,
  'kg': 1000,

  // Other (non-convertible)
  'piece': 1,
  'pieces': 1,
  'clove': 1,
  'cloves': 1,
  'egg': 1,
  'eggs': 1,
};

/**
 * Get optimal unit for a scaled quantity
 * E.g., 16 tbsp → 1 cup, 4 tbsp → 4 tbsp
 * @param {number} scaledQuantity - the new quantity
 * @param {string} originalUnit - original unit (tbsp, cup, etc)
 * @returns {object} - { quantity: string, unit: string }
 */
export function getOptimalUnit(scaledQuantity, originalUnit) {
  if (!scaledQuantity || scaledQuantity === 0) {
    return { quantity: '0', unit: originalUnit };
  }

  // Don't convert non-numeric units
  if (['piece', 'pieces', 'clove', 'cloves', 'egg', 'eggs'].includes(originalUnit)) {
    return {
      quantity: stringifyQuantity(Math.round(scaledQuantity * 2) / 2),
      unit: scaledQuantity === 1 ? originalUnit.replace(/s$/, '') : originalUnit
    };
  }

  // Volume conversions: tbsp ↔ cup
  if (['tbsp', 'tablespoon'].includes(originalUnit)) {
    if (scaledQuantity >= 16) {
      return {
        quantity: stringifyQuantity(scaledQuantity / 16),
        unit: 'cup'
      };
    } else if (scaledQuantity >= 3) {
      return { quantity: stringifyQuantity(scaledQuantity), unit: 'tbsp' };
    } else {
      return {
        quantity: stringifyQuantity(scaledQuantity * 3),
        unit: 'tsp'
      };
    }
  }

  // Volume: tsp → tbsp
  if (['tsp', 'teaspoon'].includes(originalUnit)) {
    if (scaledQuantity >= 3) {
      return {
        quantity: stringifyQuantity(scaledQuantity / 3),
        unit: 'tbsp'
      };
    }
  }

  // Cup to tbsp for very small amounts
  if (['cup', 'cups'].includes(originalUnit)) {
    if (scaledQuantity < 0.25) {
      return {
        quantity: stringifyQuantity(scaledQuantity * 16),
        unit: 'tbsp'
      };
    }
  }

  return { quantity: stringifyQuantity(scaledQuantity), unit: originalUnit };
}

// ──────────────────────────────────────────────────────────────────────────
// SCALING LOGIC
// ──────────────────────────────────────────────────────────────────────────

// Ingredients that scale non-linearly
const NONLINEAR_INGREDIENTS = {
  salt: 0.75,
  pepper: 0.75,
  spice: 0.8,
  garlic: 0.8,
  ginger: 0.8,
  chili: 0.8,
  cumin: 0.75,
  cinnamon: 0.75,
};

/**
 * Check if an ingredient should scale non-linearly
 * @param {string} ingredientName
 * @returns {number} - scale factor (0.75-1.0), or 1 for normal scaling
 */
function getNonlinearScaleFactor(ingredientName) {
  if (!ingredientName) return 1;

  const lower = ingredientName.toLowerCase();
  for (const [keyword, factor] of Object.entries(NONLINEAR_INGREDIENTS)) {
    if (lower.includes(keyword)) return factor;
  }
  return 1;
}

/**
 * Scale a single ingredient
 * @param {object} ingredient - { name, quantity, unit }
 * @param {number} scaleFactor - multiplier (e.g., 2 for double)
 * @returns {object} - scaled ingredient
 */
export function scaleIngredient(ingredient, scaleFactor) {
  if (!ingredient.quantity || ingredient.quantity === '' || ingredient.quantity === '0') {
    return { ...ingredient };
  }

  const qty = parseQuantity(ingredient.quantity);
  if (qty === 0) return { ...ingredient };

  // Check for non-numeric units that should be rounded
  if (['piece', 'pieces', 'clove', 'cloves', 'egg', 'eggs'].includes(ingredient.unit)) {
    const scaled = Math.round(qty * scaleFactor);
    return {
      ...ingredient,
      quantity: String(scaled),
    };
  }

  // Apply non-linear scaling for spices/seasonings
  const nonlinearFactor = getNonlinearScaleFactor(ingredient.name);
  const scaledQty = qty * scaleFactor * nonlinearFactor;

  // Get optimal unit
  const { quantity, unit } = getOptimalUnit(scaledQty, ingredient.unit);

  return {
    ...ingredient,
    quantity,
    unit,
  };
}

/**
 * Scale all ingredients in a recipe
 * @param {object} recipe - recipe object with ingredients array
 * @param {number} scaleFactor - multiplier
 * @returns {array} - scaled ingredients
 */
export function scaleIngredients(ingredients, scaleFactor) {
  if (!Array.isArray(ingredients)) return [];

  return ingredients.map(ing => scaleIngredient(ing, scaleFactor));
}

/**
 * Scale prep/cook times
 * @param {number} minutes
 * @param {number} scaleFactor
 * @returns {object} - { scaledTime: number, note: string }
 */
export function getScaledTime(minutes, scaleFactor) {
  if (!minutes || minutes === 0) {
    return { scaledTime: minutes, note: '' };
  }

  // Most cooking times scale linearly, but with diminishing returns for oven time
  // For now, just scale linearly but add a note
  const scaledTime = Math.round(minutes * scaleFactor);

  let note = '';
  if (scaleFactor > 1.2) {
    note = `~${scaledTime} min (for ${scaleFactor.toFixed(1)}x batch)`;
  } else if (scaleFactor < 0.8) {
    note = `~${scaledTime} min (scaled down)`;
  }

  return { scaledTime, note };
}

/**
 * Scale an entire recipe
 * @param {object} recipe - full recipe object
 * @param {number} baseServings - original serving size
 * @param {number} targetServings - new serving size
 * @returns {object} - scaled recipe
 */
export function scaleRecipe(recipe, baseServings, targetServings) {
  if (!recipe || baseServings === 0) return recipe;

  const scaleFactor = targetServings / baseServings;

  if (scaleFactor === 1) return recipe;

  return {
    ...recipe,
    ingredients: scaleIngredients(recipe.ingredients, scaleFactor),
    prepTime: recipe.prepTime ? getScaledTime(recipe.prepTime, scaleFactor).scaledTime : null,
    cookTime: recipe.cookTime ? getScaledTime(recipe.cookTime, scaleFactor).scaledTime : null,
    __scaleFactor: scaleFactor,
  };
}
