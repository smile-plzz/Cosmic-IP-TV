import { useEffect, useRef, useState, useCallback } from 'react';
import { Channel } from '@/src/types';

/**
 * Periodically probes channels in the background.
 * Separates persistent blacklist from session-based inactive status.
 */
export function useLivenessTracker(
  channels: Channel[], 
  blacklistUrl: (url: string) => void,
  enabled: boolean = true
) {
  const [offlineUrls, setOfflineUrls] = useState<Record<string, boolean>>({});
  const channelsRef = useRef<Channel[]>(channels);
  const queueRef = useRef<string[]>([]);
  const isScanningRef = useRef(false);
  
  const [queueSize, setQueueSize] = useState(0);
  
  useEffect(() => {
    channelsRef.current = channels;
    // When channels change, prioritize scanning the new ones if we haven't checked them
    const newUrls = channels.map(c => c.url).filter(url => !offlineUrls[url]);
    queueRef.current = [...new Set([...newUrls, ...queueRef.current])].slice(0, 1000); // Larger queue
    setQueueSize(queueRef.current.length);
  }, [channels, offlineUrls]);

  const probe = useCallback(async (url: string) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500); // Slightly faster timeout
      
      await fetch(url, { 
        method: 'HEAD', 
        mode: 'no-cors',
        signal: controller.signal 
      });
      
      clearTimeout(timeout);
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError' || !navigator.onLine) return true;
      return false;
    }
  }, []);

  const runBatch = useCallback(async () => {
    if (isScanningRef.current || queueRef.current.length === 0) {
      if (queueRef.current.length === 0 && queueSize !== 0) setQueueSize(0);
      return;
    }
    isScanningRef.current = true;

    // Batch size of 40
    const batch = queueRef.current.splice(0, 40);
    setQueueSize(queueRef.current.length);
    
    await Promise.all(batch.map(async (url) => {
      const isAlive = await probe(url);
      if (!isAlive) {
        setOfflineUrls(prev => ({ ...prev, [url]: true }));
      }
    }));

    isScanningRef.current = false;
  }, [probe, queueSize]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(runBatch, 800); // Check 40 every 0.8 seconds (~3000 per minute)
    return () => clearInterval(interval);
  }, [enabled, runBatch]);

  return { offlineUrls, queueSize };
}
