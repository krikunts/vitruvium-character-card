import { defineStore } from 'pinia';
import type { ThemeState } from '../types/character';

export const useThemeStore = defineStore('theme', {
  state: (): ThemeState => ({
    theme: '/themes/dark.json',
    customStyles: {},
  }),

  actions: {
    setTheme(newTheme: string) {
      this.theme = newTheme;
    },
    setCustomStyles(styles: { [key: string]: string }) {
      this.customStyles = styles;
    },
  },

  getters: {
    getTheme: (state) => state.theme,
    getCustomStyles: (state) => state.customStyles,
  },
});
