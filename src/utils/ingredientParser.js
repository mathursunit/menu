// ─── Unit aliases → canonical UNIT_OPTIONS values ─────────────────────────────
const UNIT_CANONICAL = {
  cup: 'cups',
  c: 'cups',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tbs: 'tbsp',
  tb: 'tbsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  ts: 'tsp',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lbs',
  pound: 'lbs',
  pounds: 'lbs',
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  piece: 'pieces',
  pcs: 'pieces',
  pc: 'pieces',
  clove: 'cloves',
  slice: 'slices',
  can: 'cans',
  bunch: 'bunches',
  pinches: 'pinch',
  stick: 'sticks',
  sprig: 'sprigs',
  head: 'heads',
  stalk: 'stalks',
  drop: 'drops',
  dash: 'dashes',
  handful: 'handfuls',
  sheet: 'sheets',
};

// All recognized unit tokens (longer ones first so regex matches greedily)
const KNOWN_UNITS = [
  'tablespoons', 'tablespoon', 'teaspoons', 'teaspoon',
  'milliliters', 'millilitres', 'milliliter', 'millilitre',
  'kilograms', 'kilogram', 'ounces', 'pounds', 'pound',
  'liters', 'litres', 'liter', 'litre',
  'grams', 'gram', 'cloves', 'clove',
  'slices', 'slice', 'cans', 'can',
  'bunches', 'bunch', 'pieces', 'piece',
  'pinches', 'pinch', 'sticks', 'stick',
  'sprigs', 'sprig', 'heads', 'head',
  'stalks', 'stalk', 'drops', 'drop',
  'dashes', 'dash', 'handfuls', 'handful',
  'sheets', 'sheet',
  'cups', 'cup', 'tbsp', 'tbs', 'tsp',
  'lbs', 'lb', 'oz', 'kg', 'ml', 'pcs', 'pc',
  'ts', 'tb', 'c', 'l', 'g',
];

// Unicode fractions → ASCII equivalents
const UNICODE_FRACTIONS = {
  '½': '1/2', '⅓': '1/3', '⅔': '2/3',
  '¼': '1/4', '¾': '3/4',
  '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5',
  '⅙': '1/6', '⅚': '5/6',
  '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
};

// Build a single regex for units (sorted longest-first to avoid prefix ambiguity)
const unitPattern = KNOWN_UNITS
  .map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');
const UNIT_REGEX = new RegExp(`^(${unitPattern})(?=[\\s,.]|$)`, 'i');

/**
 * Parse a single ingredient line like:
 *   "3 Large Eggs"
 *   "1/2 cup Mushrooms (sliced)"
 *   "2 slices Smoked Bacon (chopped)"
 *   "1 pinch Salt"
 *
 * Returns { name, quantity, unit } or null if the line is blank/unusable.
 */
export function parseIngredientLine(line) {
  // Normalize unicode fractions
  let s = line.trim();
  for (const [uf, rep] of Object.entries(UNICODE_FRACTIONS)) {
    s = s.replaceAll(uf, rep);
  }

  // Strip leading list markers: "- ", "• ", "* ", "1. ", "1) "
  s = s.replace(/^[-•*]\s+/, '').replace(/^\d+[.)]\s+/, '').trim();

  if (!s) return null;

  // ── 1. Extract quantity ────────────────────────────────────────────────────
  // Patterns: "1 1/2", "1/2", "3", "0.5"
  let quantity = '';
  const qtyMatch = s.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)/);
  if (qtyMatch) {
    quantity = qtyMatch[1].replace(/\s+/, ' ').trim();
    s = s.slice(qtyMatch[0].length).trimStart();
  }

  // ── 2. Extract unit ───────────────────────────────────────────────────────
  let unit = '';
  const unitMatch = s.match(UNIT_REGEX);
  if (unitMatch) {
    const raw = unitMatch[1].toLowerCase();
    unit = UNIT_CANONICAL[raw] ?? raw;   // keep as-is if already canonical
    s = s.slice(unitMatch[1].length).trimStart();
    s = s.replace(/^[,.]/, '').trimStart();
  }

  // ── 3. What remains is the ingredient name ────────────────────────────────
  const name = s.trim();
  if (!name) return null;

  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    quantity,
    unit,
  };
}

/**
 * Parse a multi-line paste into an array of ingredient objects.
 * Blank lines and unparseable lines are silently dropped.
 */
export function parseIngredients(text) {
  if (!text.trim()) return [];
  return text
    .split('\n')
    .map(parseIngredientLine)
    .filter(Boolean);
}
