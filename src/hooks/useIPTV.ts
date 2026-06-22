import { useState, useEffect, useCallback, useMemo } from 'react';
import { Channel } from '@/src/types';
import { parseM3U } from '@/src/lib/iptv';
import { streamlineCategory } from '@/src/lib/categories';

const INDEX_URL = 'https://iptv-org.github.io/iptv/index.m3u';

export function useIPTV() {
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChannels = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetching the primary global index
      const response = await fetch(`${INDEX_URL}?_=${Date.now()}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const text = await response.text();
      const parsed = parseM3U(text).map(ch => ({
        ...ch,
        category: streamlineCategory(ch.category)
      }));
      
      // Filter out empty entries if any
      const valid = parsed.filter(c => c.url && c.name);
      setAllChannels(valid);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const categories = useMemo(() => {
    const set = new Set(allChannels.map(c => c.category).filter(Boolean));
    return Array.from(set).sort();
  }, [allChannels]);

  return { allChannels, categories, isLoading, fetchChannels };
}
