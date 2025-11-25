'use client';

import { useEffect } from 'react';

export function ThemeProvider({ 
  color, 
  children 
}: { 
  color?: string; 
  children: React.ReactNode 
}) {
  useEffect(() => {
    if (color) {
      document.documentElement.style.setProperty('--primary', color);
    }
  }, [color]);

  return <>{children}</>;
}
