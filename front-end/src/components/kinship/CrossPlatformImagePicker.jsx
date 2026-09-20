import React, { useRef } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNativePlatform } from '@/lib/platform';

/**
 * A cross-platform image picker component.
 * On Native (Android/iOS): Uses Capacitor Camera plugin to pick from gallery or take a photo.
 * On Web: Falls back to a hidden `<input type="file" />`.
 */
export default function CrossPlatformImagePicker({ onImageSelected, children, className = '' }) {
  const fileInputRef = useRef(null);

  const handleNativeClick = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt // Prompts user to choose Camera or Gallery
      });
      // Return the URI so the parent can use it or upload it via fetch
      onImageSelected({ uri: image.webPath, format: image.format });
    } catch (error) {
      console.error('Error selecting native image:', error);
    }
  };

  const handleWebClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onWebFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const uri = URL.createObjectURL(file);
      onImageSelected({ uri, file });
    }
  };

  return (
    <div 
      className={`cursor-pointer ${className}`} 
      onClick={isNativePlatform() ? handleNativeClick : handleWebClick}
    >
      {children}
      {!isNativePlatform() && (
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={onWebFileChange}
        />
      )}
    </div>
  );
}
