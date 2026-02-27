import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function useRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecipes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addRecipe = async (data) => {
    return addDoc(collection(db, 'recipes'), {
      ...data,
      isFavorite: false,
      createdBy: user.uid,
      createdByName: user.displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateRecipe = async (id, data) => {
    return updateDoc(doc(db, 'recipes', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteRecipe = async (id) => {
    return deleteDoc(doc(db, 'recipes', id));
  };

  const toggleFavorite = async (id, currentValue) => {
    return updateDoc(doc(db, 'recipes', id), {
      isFavorite: !currentValue,
      updatedAt: serverTimestamp(),
    });
  };

  return { recipes, loading, addRecipe, updateRecipe, deleteRecipe, toggleFavorite };
}
