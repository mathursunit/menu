import { useState, useCallback } from 'react';
import { RECIPE_TAGS, UNIT_OPTIONS } from '../utils/constants';

// ── Config ───────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ── Prompt ───────────────────────────────────────────────────────────────────
const VALID_UNITS = UNIT_OPTIONS.filter(Boolean).join(', ');
const VALID_TAGS  = RECIPE_TAGS.join(', ');

const PROMPT = `
You are a recipe extraction assistant. Extract ALL recipe information visible in this image.
Return ONLY valid JSON — no markdown fences, no explanation.

{
  "name": "Recipe Name",
  "description": "One-sentence description",
  "prepTime": 15,
  "cookTime": 30,
  "ingredients": [
    { "name": "Flour", "quantity": "2", "unit": "cups" }
  ],
  "instructions": "Full cooking instructions as one string",
  "tags": ["breakfast"]
}

Rules:
• "unit" must be one of: ${VALID_UNITS} — or "" if there is no unit.
• "tags" must only contain values from: ${VALID_TAGS}
• "prepTime" and "cookTime" are integers (minutes) or null if not shown.
• "quantity" is always a string ("1/2", "3", "1.5") or "" if not shown.
• "ingredients" and "name" are required.
`.trim();

// ── Helpers ───────────────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function friendlyError(err) {
  const msg  = (err?.message ?? '').toLowerCase();
  const code = String(err?.status ?? err?.code ?? '').toLowerCase();
  const full = `${code} ${msg}`;
  if (full.includes('safety'))
    return 'Image was flagged by safety filters. Try a different photo.';
  if (full.includes('quota') || full.includes('429') || full.includes('resource_exhausted'))
    return 'API rate limit hit — wait a moment and try again.';
  if (full.includes('api_key') || full.includes('403') || full.includes('permission'))
    return 'API key error — contact support.';
  if (full.includes('network') || full.includes('failed to fetch'))
    return 'Network error — check your connection and try again.';
  return "Couldn't read the recipe from this image. Try a clearer photo.";
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useRecipeImageParser() {
  const [analyzing,    setAnalyzing]    = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  const parseImage = useCallback(async (file) => {
    setAnalyzing(true);
    setAnalyzeError(null);

    try {
      const base64 = await fileToBase64(file);

      // Call Gemini REST API directly
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: file.type, data: base64 } },
            ],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                name:         { type: 'STRING' },
                description:  { type: 'STRING' },
                prepTime:     { type: 'NUMBER' },
                cookTime:     { type: 'NUMBER' },
                instructions: { type: 'STRING' },
                tags:         { type: 'ARRAY', items: { type: 'STRING' } },
                ingredients: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      name:     { type: 'STRING' },
                      quantity: { type: 'STRING' },
                      unit:     { type: 'STRING' },
                    },
                    required: ['name', 'quantity', 'unit'],
                  },
                },
              },
              required: ['name', 'ingredients'],
            },
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const apiErr  = errData?.error ?? {};
        throw Object.assign(
          new Error(apiErr.message ?? `HTTP ${response.status}`),
          { status: response.status, code: apiErr.status }
        );
      }

      const data   = await response.json();
      const text   = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
      const parsed = JSON.parse(text);

      // Normalise fields so the form never sees undefined/wrong types
      return {
        name:         parsed.name         ?? '',
        description:  parsed.description  ?? '',
        prepTime:     parsed.prepTime     ?? '',
        cookTime:     parsed.cookTime     ?? '',
        instructions: parsed.instructions ?? '',
        tags:         (parsed.tags ?? []).filter(t => RECIPE_TAGS.includes(t)),
        ingredients:  (parsed.ingredients ?? []).map(ing => ({
          name:     ing.name     ?? '',
          quantity: String(ing.quantity ?? ''),
          unit:     UNIT_OPTIONS.includes(ing.unit) ? ing.unit : '',
        })),
      };
    } catch (err) {
      console.error('[RecipeImageParser]', err);
      setAnalyzeError(friendlyError(err));
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  return { parseImage, analyzing, analyzeError };
}
