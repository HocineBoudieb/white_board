'use client';

import { useEffect } from 'react';
import { useTour } from '@reactour/tour';

export default function ProjectTour() {
  const { setIsOpen } = useTour();

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem('hasSeenProjectTour');
    if (!hasSeenTour) {
      // Open the tour
      setIsOpen(true);
    }
  }, [setIsOpen]);

  return null;
}
