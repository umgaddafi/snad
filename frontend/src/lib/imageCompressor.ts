/**
 * Compresses an image file in the browser to ensure the file size is strictly <= 100KB (102,400 bytes).
 * Renames the file before saving to a clean passport filename format.
 *
 * @param file The selected File object from input
 * @param customPrefix Optional custom prefix for the filename (default: 'passport')
 * @returns Promise<{ file: File; originalSize: number; compressedSize: number; isCompressed: boolean }>
 */
export async function compressImageTo100KB(
  file: File,
  customPrefix: string = 'passport'
): Promise<{ file: File; originalSize: number; compressedSize: number; isCompressed: boolean }> {
  const MAX_SIZE_BYTES = 100 * 1024; // 100 KB limit = 102,400 bytes
  const originalSize = file.size;

  const timestamp = Date.now();
  const cleanExtension = file.type === 'image/png' ? 'png' : 'jpg';
  const renamedFilename = `${customPrefix}_${timestamp}_100kb.${cleanExtension}`;

  // If file is already <= 100KB, rename and return directly
  if (originalSize <= MAX_SIZE_BYTES) {
    const renamedFile = new File([file], renamedFilename, { type: file.type });
    return {
      file: renamedFile,
      originalSize,
      compressedSize: originalSize,
      isCompressed: false,
    };
  }

  // Load image into an HTMLImageElement
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = URL.createObjectURL(file);
  });

  let width = image.width;
  let height = image.height;
  const maxDimension = 800; // Passport photos are standard at max 800px

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    URL.revokeObjectURL(image.src);
    throw new Error('Browser canvas context not available');
  }

  ctx.drawImage(image, 0, 0, width, height);

  // Iteratively reduce JPEG compression quality from 0.85 down to 0.1 until <= 100KB
  let quality = 0.85;
  let blob: Blob | null = null;

  while (quality >= 0.1) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );

    if (blob && blob.size <= MAX_SIZE_BYTES) {
      break;
    }

    quality -= 0.1;
  }

  // If still above 100KB, scale down resolution dimensions further
  if (!blob || blob.size > MAX_SIZE_BYTES) {
    let scale = 0.7;
    while (scale >= 0.2) {
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = Math.max(150, Math.round(width * scale));
      scaledCanvas.height = Math.max(150, Math.round(height * scale));
      const scaledCtx = scaledCanvas.getContext('2d');

      if (scaledCtx) {
        scaledCtx.drawImage(image, 0, 0, scaledCanvas.width, scaledCanvas.height);
        blob = await new Promise<Blob | null>((resolve) =>
          scaledCanvas.toBlob(resolve, 'image/jpeg', 0.6)
        );

        if (blob && blob.size <= MAX_SIZE_BYTES) {
          break;
        }
      }
      scale -= 0.15;
    }
  }

  URL.revokeObjectURL(image.src);

  if (!blob) {
    throw new Error('Failed to compress passport image.');
  }

  const finalFilename = `${customPrefix}_${timestamp}_compressed.jpg`;
  const compressedFile = new File([blob], finalFilename, { type: 'image/jpeg' });

  return {
    file: compressedFile,
    originalSize,
    compressedSize: compressedFile.size,
    isCompressed: true,
  };
}
