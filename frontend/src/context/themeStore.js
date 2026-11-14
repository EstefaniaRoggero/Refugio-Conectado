import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set, get) => ({
      darkMode: false,
      toggleDark: () => {
        const next = !get().darkMode;
        document.documentElement.classList.toggle('dark', next);
        set({ darkMode: next });
      },
      initTheme: () => {
        const dark = get().darkMode;
        document.documentElement.classList.toggle('dark', dark);
      },
    }),
    { name: 'refugio-theme' }
  )
);

export default useThemeStore;
