import { useRef } from 'react';
import { Check, Plus, X, Camera } from 'lucide-react';
import usePhotoUpload from '../../hooks/usePhotoUpload';
import './MealSlot.css';

export default function MealSlot({ dateId, mealType, label, meal, onSlotClick, onRemove, onToggleCooked, onSetPhoto }) {
  const fileRef = useRef(null);
  const { uploadPhoto, uploading } = usePhotoUpload();
  const hasRecipe = meal?.recipeId;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadPhoto(file, dateId, mealType);
    await onSetPhoto(dateId, mealType, url);
  };

  if (!hasRecipe) {
    return (
      <button className="meal-slot meal-slot--empty" onClick={onSlotClick} aria-label={`Add ${label}`}>
        <Plus size={14} />
        <span className="meal-slot-label">{label}</span>
      </button>
    );
  }

  return (
    <div className={`meal-slot ${meal.isCooked ? 'meal-slot--cooked' : 'meal-slot--planned'}`}>
      <div className="meal-slot-top">
        <span className="meal-slot-label">{label}</span>
        <div className="meal-slot-actions">
          <button onClick={onToggleCooked} className="meal-slot-action" aria-label={meal.isCooked ? 'Unmark cooked' : 'Mark cooked'}>
            <Check size={14} />
          </button>
          {meal.isCooked && !meal.photoUrl && (
            <>
              <button onClick={() => fileRef.current?.click()} className="meal-slot-action" aria-label="Upload photo" disabled={uploading}>
                <Camera size={14} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} hidden />
            </>
          )}
          <button onClick={onRemove} className="meal-slot-action meal-slot-action--remove" aria-label="Remove meal">
            <X size={14} />
          </button>
        </div>
      </div>
      <span className="meal-slot-recipe">{meal.recipeName}</span>
      {meal.photoUrl && (
        <img src={meal.photoUrl} alt="Cooked meal" className="meal-slot-photo" />
      )}
    </div>
  );
}
