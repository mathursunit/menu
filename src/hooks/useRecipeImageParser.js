import { useState, useCallback } from 'react';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import app from '../lib/firebase';
import { RECIPE_TAGS, UNIT_OPTIONS } from '../utils/constants';

// ── Prompt ──────────────────────────────────────────────────────────────────
const VALID_UNITS = UNIT_OPTIONS.filter(Boolean).join(', ');
const VALID_TAGS  = RECIPE_TAGS.join(', ');

const PROMPT = `
You are a recipe extraction assistant. Extract ALL recipe information visible in this image.
Return ONLY valid JSON — no markdown fences, no explanation. Use this exact structure:

{
  "name": "Recipe Name",
  "description": "One-sentence description of the dish",
  "prepTime": 15,
  "cookTime": 30,
  "ingredients": [
    { "name": "Flour", "quantity": "2", "unit": "cups" }
  ],
  "instructions": "Full cooking instructions as one string",
  "tags": ["breakfast"]
}

Rules:
• "unit" must be one of: ${VALID_UNITS} — or an empty string "" if there is no unit.
• "tags" must only contain values from: ${VALID_TAGS} — pick only the ones that fit.
• "prepTime" and "cookTime" are integers (minutes). Use null if not shown.
• "quantity" is always a string (e.g. "1/2", "3", "1.5"). Use "" if not shown.
• If any top-level field cannot be determined, use null.
• "ingredients" and "name" are required — always include them.
`.trim();

// ── Schema for guaranteed-valid JSON output ──────────────────────────────────
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    name:         { type: 'string' },
    description:  { type: 'string' },
    prepTime:     { type: 'number' },
    cookTime:     { type: 'number' },
    instructions: { type: 'string' },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name:     { type: 'string' },
          quantity: { type: 'string' },
          unit:     { type: 'string' },
        },
        required: ['name', 'quantity', 'unit'],
      },
    },
    tags: { type: 'array', items: { type: 'string' } },
  },
  required: ['name', 'ingredients'],
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function friendlyError(err) {
  const msg   = err?.message ?? '';
  const code  = err?.code    ?? '';
  const full  = `${code} ${msg}`.toLowerCase();
  console.error('[RecipeImageParser] raw error:', err);
  if (full.includes('safety'))
    return 'Image was flagged by safety filters. Try a different photo.';
  if (full.includes('network') || full.includes('fetch failed'))
    return 'Network error — check your connection and try again.';
  // Surface the real message during debugging
  return `Import failed: ${code || msg || 'unknown error'}`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useRecipeImageParser() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  const parseImage = useCallback(async (file) => {
    setAnalyzing(true);
    setAnalyzeError(null);

    try {
      const base64 = await fileToBase64(file);

      const ai    = getAI(app, { backend: new GoogleAIBackend() });
      const model = getGenerativeModel(ai, {
        model: 'gemini-2.0-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      });

      const result = await model.generateContent([
        PROMPT,
        { inlineData: { data: base64, mimeType: file.type } },
      ]);

      const raw    = result.response.text();
      const parsed = JSON.parse(raw);

      // Normalise so the form never gets undefined fields
      return {
        name:         parsed.name        ?? '',
        description:  parsed.description ?? '',
        prepTime:     parsed.prepTime    ?? '',
        cookTime:     parsed.cookTime    ?? '',
        instructions: parsed.instructions ?? '',
        tags:         Array.isArray(parsed.tags) ? parsed.tags.filter(t => RECIPE_TAGS.includes(t)) : [],
        ingredients:  (parsed.ingredients ?? []).map(ing => ({
          name:     ing.name     ?? '',
          quantity: String(ing.quantity ?? ''),
          unit:     UNIT_OPTIONS.includes(ing.unit) ? ing.unit : '',
        })),
      };
    } catch (err) {
      console.error('Recipe image parse error:', err);
      setAnalyzeError(friendlyError(err));
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  return { parseImage, analyzing, analyzeError };
}
