import { useState, useEffect, useCallback } from 'react';
import { Channel } from '@/src/types';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem('favorite_channels');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = useCallback((channel: Channel) => {
    setFavorites(prev => {
      const exists = prev.some(c => c.url === channel.url);
      const next = exists 
        ? prev.filter(c => c.url !== channel.url)
        : [channel, ...prev];
      localStorage.setItem('favorite_channels', JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = (url: string) => favorites.some(c => c.url === url);

  return { favorites, toggleFavorite, isFavorite };
}
