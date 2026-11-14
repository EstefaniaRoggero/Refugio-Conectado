import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useTenantStore = create(
  persist(
    (set) => ({
      refugio: null,
      slug: null,
      setRefugio: (refugio) => set({
        refugio,
        slug: refugio?.slug || null,
      }),
      clearRefugio: () => set({ refugio: null, slug: null }),
    }),
    { name: 'refugio-tenant' }
  )
);

export default useTenantStore;
