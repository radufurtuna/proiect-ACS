'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { layoutStyles, COLORS } from '@/utils/styles';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div style={layoutStyles.centeredContainer}>
      <p style={{ color: COLORS.textSecondary }}>Se încarcă pagina de autentificare...</p>
    </div>
  );
}
