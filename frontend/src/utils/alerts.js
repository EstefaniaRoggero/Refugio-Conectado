const baseConfig = {
  confirmButtonColor: '#C67B5C',
  cancelButtonColor: '#8B7355',
  customClass: { popup: 'rounded-2xl' },
};

let swalModule = null;

const getSwal = async () => {
  if (!swalModule) {
    swalModule = (await import('sweetalert2')).default;
  }
  return swalModule;
};

export const showSuccess = async (title, text = '') => {
  const Swal = await getSwal();
  return Swal.fire({ icon: 'success', title, text, ...baseConfig });
};

export const showError = async (title, text = '') => {
  const Swal = await getSwal();
  return Swal.fire({ icon: 'error', title, text, ...baseConfig });
};

export const showConfirm = async (title, text = '') => {
  const Swal = await getSwal();
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: 'Sí, confirmar',
    cancelButtonText: 'Cancelar',
    ...baseConfig,
  });
};

export const showPrompt = async (title, { placeholder = '', confirmText = 'Confirmar' } = {}) => {
  const Swal = await getSwal();
  return Swal.fire({
    title,
    input: 'text',
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar',
    ...baseConfig,
  });
};

export const showLoading = async (title = 'Cargando...') => {
  const Swal = await getSwal();
  return Swal.fire({ title, allowOutsideClick: false, didOpen: () => Swal.showLoading(), ...baseConfig });
};

export const closeAlert = async () => {
  const Swal = await getSwal();
  Swal.close();
};
