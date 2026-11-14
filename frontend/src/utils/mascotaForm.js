import { pickMascotaFields } from '../constants/mascota';

export function buildMascotaPayload(form, imageFile) {
  const data = pickMascotaFields(form);
  if (!imageFile) return data;

  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) fd.append(key, value);
  });
  fd.append('imagen', imageFile);
  return fd;
}
