import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_PREFERENCES = {
  cuisinePreferences: [],
  difficultyLevel: 'moderate',
  macro: {
    targetProteinRatio: 0.4,
    targetCarbRatio: 0.35,
    targetFatRatio: 0.25,
  },
  excludeRecipeIds: [],
  mealsPerDay: 3,
};

const STORAGE_KEY = (userId) => `mealplanner-prefs-${userId}`;
const DEBOUNCE_MS = 2000;

export function useMealPlannerPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Load preferences from localStorage on mount, then sync from Firestore
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        // Try localStorage first (instant load)
        const cached = localStorage.getItem(STORAGE_KEY(user.uid));
        if (cached) {
          try {
            setPreferences(JSON.parse(cached));
          } catch (e) {
            console.error('Invalid cached preferences:', e);
          }
        }

        // Sync from Firestore
        const docRef = doc(db, 'mealPlannerPreferences', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const firestorePrefs = docSnap.data();
          setPreferences(firestorePrefs);
          localStorage.setItem(STORAGE_KEY(user.uid), JSON.stringify(firestorePrefs));
        } else {
          // Create default preferences if none exist
          const defaultWithUser = {
            uid: user.uid,
            ...DEFAULT_PREFERENCES,
            updatedAt: new Date().toISOString(),
          };
          await setDoc(docRef, {
            ...defaultWithUser,
            updatedAt: serverTimestamp(),
          });
          setPreferences(defaultWithUser);
          localStorage.setItem(STORAGE_KEY(user.uid), JSON.stringify(defaultWithUser));
        }
      } catch (error) {
        console.error('Error loading meal planner preferences:', error);
        // Fall back to cached or default
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user?.uid]);

  // Save preferences to both localStorage and Firestore (debounced)
  const savePreferences = useCallback(
    async (newPrefs) => {
      if (!user?.uid) return;

      setPreferences(newPrefs);
      localStorage.setItem(STORAGE_KEY(user.uid), JSON.stringify(newPrefs));

      // Clear existing debounce timer
      if (debounceTimer) clearTimeout(debounceTimer);

      // Debounce Firestore write
      const timer = setTimeout(async () => {
        try {
          const docRef = doc(db, 'mealPlannerPreferences', user.uid);
          await setDoc(docRef, {
            ...newPrefs,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          console.error('Error saving meal planner preferences:', error);
        }
      }, DEBOUNCE_MS);

      setDebounceTimer(timer);
    },
    [user?.uid, debounceTimer]
  );

  const saveCuisines = useCallback(
    (cuisines) => {
      savePreferences({
        ...preferences,
        cuisinePreferences: cuisines,
      });
    },
    [preferences, savePreferences]
  );

  const setDifficulty = useCallback(
    (level) => {
      savePreferences({
        ...preferences,
        difficultyLevel: level,
      });
    },
    [preferences, savePreferences]
  );

  const setMacroTargets = useCallback(
    (proteinRatio, carbRatio, fatRatio) => {
      savePreferences({
        ...preferences,
        macro: {
          targetProteinRatio: proteinRatio,
          targetCarbRatio: carbRatio,
          targetFatRatio: fatRatio,
        },
      });
    },
    [preferences, savePreferences]
  );

  const addExcludedRecipe = useCallback(
    (recipeId) => {
      const updated = preferences.excludeRecipeIds.includes(recipeId)
        ? preferences.excludeRecipeIds
        : [...preferences.excludeRecipeIds, recipeId];

      savePreferences({
        ...preferences,
        excludeRecipeIds: updated,
      });
    },
    [preferences, savePreferences]
  );

  const clearExcluded = useCallback(() => {
    savePreferences({
      ...preferences,
      excludeRecipeIds: [],
    });
  }, [preferences, savePreferences]);

  const resetPreferences = useCallback(() => {
    savePreferences(DEFAULT_PREFERENCES);
  }, [savePreferences]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [debounceTimer]);

  return {
    preferences,
    loading,
    saveCuisines,
    setDifficulty,
    setMacroTargets,
    addExcludedRecipe,
    clearExcluded,
    resetPreferences,
    savePreferences, // For direct preference updates
  };
}
