import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getWeekDates, getMonthDates } from '../utils/dates';

export default function useMealPlan(startDate, view = 'week') {
  const [mealPlan, setMealPlan] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!startDate) return;

    const dateIds = view === 'month' ? getMonthDates(startDate) : getWeekDates(startDate);
    let loaded = 0;

    const unsubscribes = dateIds.map((dateId) =>
      onSnapshot(doc(db, 'mealPlans', dateId), (snap) => {
        setMealPlan((prev) => ({
          ...prev,
          [dateId]: snap.exists() ? snap.data() : null,
        }));
        loaded++;
        if (loaded >= dateIds.length) setLoading(false);
      })
    );

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [startDate, view]);

  const assignMeal = useCallback(
    async (dateId, mealType, recipe) => {
      const ref = doc(db, 'mealPlans', dateId);
      return setDoc(
        ref,
        {
          date: dateId,
          meals: {
            [mealType]: {
              recipeId: recipe.id,
              recipeName: recipe.name,
              isCooked: false,
              cookedAt: null,
              cookedBy: null,
              photoUrl: null,
            },
          },
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        },
        { merge: true }
      );
    },
    [user]
  );

  const removeMeal = useCallback(
    async (dateId, mealType) => {
      const ref = doc(db, 'mealPlans', dateId);
      return setDoc(
        ref,
        {
          date: dateId,
          meals: {
            [mealType]: {
              recipeId: null,
              recipeName: null,
              isCooked: false,
              cookedAt: null,
              cookedBy: null,
              photoUrl: null,
            },
          },
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        },
        { merge: true }
      );
    },
    [user]
  );

  const toggleCooked = useCallback(
    async (dateId, mealType, currentMeal) => {
      const ref = doc(db, 'mealPlans', dateId);
      const isCooked = !currentMeal.isCooked;
      return setDoc(
        ref,
        {
          meals: {
            [mealType]: {
              isCooked,
              cookedAt: isCooked ? serverTimestamp() : null,
              cookedBy: isCooked ? user.uid : null,
            },
          },
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        },
        { merge: true }
      );
    },
    [user]
  );

  const setMealPhoto = useCallback(
    async (dateId, mealType, photoUrl) => {
      const ref = doc(db, 'mealPlans', dateId);
      return setDoc(
        ref,
        {
          meals: {
            [mealType]: { photoUrl },
          },
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        },
        { merge: true }
      );
    },
    [user]
  );

  const applyGeneratedMeals = useCallback(
    async (generatedPlan) => {
      try {
        // Apply each meal to the calendar
        for (const [dateId, meals] of Object.entries(generatedPlan)) {
          const ref = doc(db, 'mealPlans', dateId);

          const mealsObject = {};
          for (const [mealType, recipe] of Object.entries(meals)) {
            if (recipe) {
              mealsObject[mealType] = {
                recipeId: recipe.id,
                recipeName: recipe.name,
                isCooked: false,
                cookedAt: null,
                cookedBy: null,
                photoUrl: null,
              };
            }
          }

          await setDoc(
            ref,
            {
              date: dateId,
              meals: mealsObject,
              updatedAt: serverTimestamp(),
              updatedBy: user.uid,
            },
            { merge: true }
          );
        }
      } catch (error) {
        console.error('Error applying generated meals:', error);
        throw error;
      }
    },
    [user]
  );

  return {
    mealPlan,
    loading,
    assignMeal,
    removeMeal,
    toggleCooked,
    setMealPhoto,
    applyGeneratedMeals,
  };
}
