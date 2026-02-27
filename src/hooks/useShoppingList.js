import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function useShoppingList() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'shoppingLists'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLists(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const createList = async (startDate, endDate, items) => {
    return addDoc(collection(db, 'shoppingLists'), {
      startDate,
      endDate,
      items: items.map((item, i) => ({
        id: `item-${i}`,
        name: item.name,
        quantity: item.quantity,
        checked: false,
        checkedBy: null,
      })),
      createdAt: serverTimestamp(),
      createdBy: user.uid,
    });
  };

  const toggleItem = async (listId, items, itemId) => {
    const updated = items.map((item) =>
      item.id === itemId
        ? { ...item, checked: !item.checked, checkedBy: !item.checked ? user.uid : null }
        : item
    );
    return updateDoc(doc(db, 'shoppingLists', listId), { items: updated });
  };

  const deleteList = async (listId) => {
    return deleteDoc(doc(db, 'shoppingLists', listId));
  };

  return { lists, loading, createList, toggleItem, deleteList };
}
