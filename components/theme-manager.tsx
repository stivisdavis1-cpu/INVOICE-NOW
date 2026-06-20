'use client';

import { useEffect } from 'react';
import { useDataStore } from '@/store/data-store';

// Helper to convert hex to rgb and lighten/darken
function adjustColor(color: string, amount: number) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

export function ThemeManager() {
  const themeColor = useDataStore((state) => state.settings.themeColor);

  useEffect(() => {
    if (themeColor) {
      const root = document.documentElement;
      
      // Calculate light and dark variants based on the base color
      // A simple approach is adding/subtracting values from hex
      const lightColor = adjustColor(themeColor, 180); // very light
      const darkColor = adjustColor(themeColor, -40); // darker

      root.style.setProperty('--primary', themeColor);
      root.style.setProperty('--primary-light', lightColor);
      root.style.setProperty('--primary-dark', darkColor);
    }
  }, [themeColor]);

  return null;
}
