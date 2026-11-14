export const ALLOWED_PET_IMAGE_TYPES = ['image/jpeg', 'image/png'];

export function validatePetImage(file) {
  if (!file) return { valid: false, message: 'No se seleccionó ningún archivo' };
  if (!ALLOWED_PET_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, message: 'Solo se permiten archivos JPG y PNG' };
  }
  return { valid: true };
}
