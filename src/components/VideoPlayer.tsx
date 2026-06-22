import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, AlertCircle, Loader2, Maximize2, MonitorPlay } from 'lucide-react';
import { Channel } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface VideoPlayerProps {
  channel: Channel | null;
  onNext: () => void;
  volume: number;
  isMuted: boolean;
  onPlayError?: (url: string) => void;
}

export function VideoPlayer({ channel, onNext, volume, isMuted, onPlayError }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    setIsPiPSupported(document.pictureInPictureEnabled);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const onPlayErrorRef = useRef(onPlayError);
  useEffect(() => {
    onPlayErrorRef.current = onPlayError;
  }, [onPlayError]);

  useEffect(() => {
    if (!channel) {
      setStatus('idle');
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setStatus('loading');
    setErrorMsg('');

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const url = channel.url;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        maxBufferLength: 30,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        setStatus('playing');
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setStatus('error');
          setErrorMsg('Stream unavailable, offline, or CORS-restricted by browser policies');
          if (onPlayErrorRef.current) {
            onPlayErrorRef.current(url);
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
        setStatus('playing');
      }, { once: true });
      video.addEventListener('error', () => {
        setStatus('error');
        setErrorMsg('Stream failed to load due to server offline status or protocol restrictions');
        if (onPlayErrorRef.current) {
          onPlayErrorRef.current(url);
        }
      }, { once: true });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('Failed to toggle PiP:', err);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative flex-1 bg-black overflow-hidden flex items-center justify-center group"
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        playsInline
      />

      <AnimatePresence>
        {status === 'idle' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute flex flex-col items-center gap-6 text-gray-500"
          >
            <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center shadow-2xl relative group">
              <div className="absolute inset-0 rounded-full bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/10 transition-all" />
              <Play className="w-10 h-10 text-emerald-500/40 relative z-10" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Select Stream</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-600">Choose a channel from the sidebar to begin</span>
            </div>
          </motion.div>
        )}

        {status === 'loading' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4"
          >
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <span className="font-mono text-xs text-gray-400 animate-pulse uppercase tracking-wider">Connecting to Stream...</span>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-6 p-10 text-center"
          >
            <AlertCircle className="w-16 h-16 text-red-500 animate-pulse" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">Playback Refused</h3>
              <p className="text-gray-400 max-w-sm font-mono text-xs">{errorMsg}</p>
              <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-md text-[10px] font-mono uppercase tracking-wider max-w-xs mx-auto mt-3">
                Stream flagged & auto-hidden
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={onNext}
                className="px-6 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors font-mono text-xs uppercase cursor-pointer"
              >
                Try Next Stream
              </button>
              <button 
                onClick={() => setStatus('idle')}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors font-mono text-xs uppercase cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {isPiPSupported && status === 'playing' && (
          <button 
            onClick={togglePiP}
            className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-lg transition-all active:scale-95 cursor-pointer"
            title="Picture-in-Picture"
          >
            <MonitorPlay className="w-5 h-5" />
          </button>
        )}
        <button 
          onClick={toggleFullscreen}
          className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-lg transition-all active:scale-95 cursor-pointer"
          title="Fullscreen"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
