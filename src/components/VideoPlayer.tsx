import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, AlertCircle, Loader2, Maximize2 } from 'lucide-react';
import { Channel } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';

interface VideoPlayerProps {
  channel: Channel | null;
  onNext: () => void;
  volume: number;
  isMuted: boolean;
}

export function VideoPlayer({ channel, onNext, volume, isMuted }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Volume + mute sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.min(Math.max(volume / 100, 0), 1);
    video.muted = isMuted;
  }, [volume, isMuted]);

  // Stream handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!channel) {
      setStatus('idle');
      setErrorMsg('');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    // cleanup previous stream
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const url = channel.url;

    const tryPlay = async () => {
      try {
        await video.play();
        setStatus('playing');
      } catch {
        // autoplay might be blocked (mobile safe handling)
        setStatus('playing');
      }
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        maxBufferLength: 20,
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, tryPlay);

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setStatus('error');
          setErrorMsg('Stream unavailable or network blocked');
          hls.destroy();
          hlsRef.current = null;
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;

      const onLoaded = () => {
        tryPlay();
      };

      const onError = () => {
        setStatus('error');
        setErrorMsg('Stream failed to load');
      };

      video.addEventListener('loadedmetadata', onLoaded, { once: true });
      video.addEventListener('error', onError, { once: true });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel]);

  // Fullscreen (mobile + desktop safe)
  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;

    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // fallback (iOS Safari limitation)
    }
  };

  return (
    <div
      ref={containerRef}
      className="
        relative flex-1 bg-black overflow-hidden flex items-center justify-center group
        w-full h-full
      "
    >
      <video
        ref={videoRef}
        className="
          w-full h-full object-contain bg-black
          max-h-[100vh]
        "
        controls
        playsInline
        webkit-playsinline="true"
      />

      <AnimatePresence>
        {status === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute flex flex-col items-center gap-6 text-gray-500 px-4"
          >
            <Play className="w-12 h-12 text-emerald-400/40" />
            <span className="text-xs uppercase tracking-widest text-gray-400 text-center">
              Select a channel to start streaming
            </span>
          </motion.div>
        )}

        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60"
          >
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              Connecting...
            </span>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 p-6 text-center"
          >
            <AlertCircle className="w-14 h-14 text-red-500" />
            <p className="text-sm text-gray-300 max-w-sm">{errorMsg}</p>

            <div className="flex gap-3">
              <button onClick={onNext} className="px-4 py-2 text-xs bg-emerald-500/10 text-emerald-400 rounded">
                Next Stream
              </button>
              <button onClick={() => setStatus('idle')} className="px-4 py-2 text-xs bg-gray-800 text-gray-300 rounded">
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 p-2 bg-black/40 hover:bg-black/70 rounded opacity-0 group-hover:opacity-100 transition"
      >
        <Maximize2 className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
