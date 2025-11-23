'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace('/projects');
  }, [router]);
  return null;
}
