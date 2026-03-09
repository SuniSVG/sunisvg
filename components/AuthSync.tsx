'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function AuthSync() {
  const { refreshCurrentUser } = useAuth();

  useEffect(() => {
    const handleSync = () => {
      // Đồng bộ lại trạng thái user khi localStorage thay đổi ở tab khác
      // hoặc khi người dùng quay lại tab (focus)
      refreshCurrentUser({ silent: true });
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [refreshCurrentUser]);

  return null;
}