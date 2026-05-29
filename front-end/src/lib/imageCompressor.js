/**
 * Compresses an image file using HTML5 Canvas.
 * Returns a Promise that resolves to a base64 DataURL of the compressed image.
 * Falls back to the original uncompressed image file (via FileReader) if canvas compression fails.
 * 
 * @param {File} file - The file to compress.
 * @param {Object} options - Compression options.
 * @param {number} options.maxWidth - Maximum width of the compressed image. Default 1024.
 * @param {number} options.maxHeight - Maximum height of the compressed image. Default 1024.
 * @param {number} options.quality - Quality rating from 0.0 to 1.0. Default 0.7.
 */
export function compressImage(file, { maxWidth = 1024, maxHeight = 1024, quality = 0.7 } = {}) {
  return new Promise((resolve) => {
    // Helper to read raw file as fallback if compression fails
    const fallbackToRaw = () => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };

    if (!file || !file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            fallbackToRaw();
            return;
          }

          // Draw image on canvas (performs resizing)
          ctx.drawImage(img, 0, 0, width, height);

          // Get compressed dataURL as JPEG
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          
          if (dataUrl && dataUrl.startsWith("data:image/")) {
            resolve(dataUrl);
          } else {
            fallbackToRaw();
          }
        } catch (error) {
          console.error("Canvas image compression failed, falling back to raw upload:", error);
          fallbackToRaw();
        }
      };
      img.onerror = () => {
        fallbackToRaw();
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      fallbackToRaw();
    };
    reader.readAsDataURL(file);
  });
}
