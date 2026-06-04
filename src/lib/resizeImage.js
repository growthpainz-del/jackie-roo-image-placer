/**
 * Resizes an image file to a max dimension and compresses it.
 * Returns a new File object ready for upload.
 */
const MAX_DIM = 2048;
const QUALITY = 0.85;

export async function resizeImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const { naturalWidth: w, naturalHeight: h } = img;

      // Skip resize if already small enough
      if (w <= MAX_DIM && h <= MAX_DIM) {
        resolve(file);
        return;
      }

      const scale = Math.min(MAX_DIM / w, MAX_DIM / h);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          const resized = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(resized);
        },
        'image/jpeg',
        QUALITY
      );
    };

    img.src = objectUrl;
  });
}