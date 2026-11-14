/**
 * Reduce una foto (típicamente de celular) a JPEG de tamaño razonable antes de subirla.
 * Las fotos originales suelen superar el límite del backend (5 MB) y el de Vercel (4,5 MB por envío).
 */
export async function compressImage(file, { maxSize = 1280, quality = 0.8 } = {}) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('El archivo no es una imagen');
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('No se pudo leer la imagen. Probá con una foto JPG o PNG.'));
      image.src = url;
    });

    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) throw new Error('No se pudo procesar la imagen');

    const name = file.name.replace(/\.[^.]+$/, '') || 'foto';
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(url);
  }
}
