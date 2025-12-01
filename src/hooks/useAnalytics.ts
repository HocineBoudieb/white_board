import { useCallback } from 'react';

export function useAnalytics() {
  const track = useCallback(async (event: string, data?: { category?: string; label?: string; metadata?: any; userId?: string }) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          ...data,
        }),
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }, []);

  return { track };
}
