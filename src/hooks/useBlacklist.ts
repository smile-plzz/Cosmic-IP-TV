import { useState, useEffect, useCallback } from 'react';

export function useBlacklist() {
  const [blacklistedUrls, setBlacklistedUrls] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('blacklisted_channels');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const blacklistUrl = useCallback((url: string) => {
    setBlacklistedUrls(prev => {
      const next = { ...prev, [url]: true };
      localStorage.setItem('blacklisted_channels', JSON.stringify(next));
      return next;
    });
  }, []);

  const clearBlacklist = useCallback(() => {
    setBlacklistedUrls({});
    localStorage.removeItem('blacklisted_channels');
  }, []);

  return { blacklistedUrls, blacklistUrl, clearBlacklist };
}
