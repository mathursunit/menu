import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

// Compress image client-side before uploading
async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function usePhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadPhoto = async (file, dateString, mealType) => {
    setUploading(true);
    setProgress(0);

    try {
      const compressed = await compressImage(file);
      setProgress(30);

      const fileName = `${dateString}_${mealType}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `meal-photos/${fileName}`);

      await uploadBytes(storageRef, compressed);
      setProgress(80);

      const url = await getDownloadURL(storageRef);
      setProgress(100);

      return url;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return { uploadPhoto, uploading, progress };
}
