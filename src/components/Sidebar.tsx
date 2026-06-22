import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Channel, ActiveTab } from '@/src/types';
import { ChannelItem } from './ChannelItem';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { ChannelSkeleton } from './Skeleton';

interface SidebarProps {
  channels: Channel[];
  recentChannels: Channel[];
  favoriteChannels: Channel[];
  curCh: Channel | null;
  onChannelSelect: (ch: Channel, idx: number) => void;
  onToggleFavorite: (ch: Channel) => void;
  isFavorite: (url: string) => boolean;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isLoading?: boolean;
}

const ITEM_H = 52;
const OVERSCAN = 10;

export function Sidebar({ 
  channels, 
  recentChannels, 
  favoriteChannels,
  curCh, 
  onChannelSelect, 
  onToggleFavorite,
  isFavorite,
  activeTab, 
  setActiveTab,
  isLoading 
}: SidebarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setHeight(entry.contentRect.height);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleChannels = useMemo(() => {
    if (activeTab === 'recent') return recentChannels;
    if (activeTab === 'favorites') return favoriteChannels;
    if (activeTab === 'hd') {
       return channels.filter(ch => {
        const q = (ch.quality || '').toLowerCase();
        const n = (ch.name || '').toLowerCase();
        return q.includes('hd') || q.includes('720') || q.includes('1080') || /\bhd\b/.test(n);
      });
    }
    return channels;
  }, [activeTab, channels, recentChannels, favoriteChannels]);

  // Virtualization math
  const total = visibleChannels.length;
  const start = Math.max(0, Math.floor(scrollTop / ITEM_H) - OVERSCAN);
  const visibleCount = Math.ceil(height / ITEM_H);
  const end = Math.min(total, start + visibleCount + OVERSCAN * 2);

  const visibleItems = useMemo(() => {
    return visibleChannels.slice(start, end).map((ch, i) => ({
      ch,
      index: start + i
    }));
  }, [visibleChannels, start, end]);

  return (
    <div className="w-full lg:w-[320px] h-full flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/[0.07] bg-[#0b0d11] flex flex-col overflow-hidden">
      <div className="flex border-b border-white/[0.05] flex-shrink-0 bg-transparent">
        {(['all', 'hd', 'recent', 'favorites'] as ActiveTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-4 text-[10px] font-bold tracking-[0.1em] uppercase transition-all relative overflow-hidden group cursor-pointer",
              activeTab === tab ? "text-white" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <span className="relative z-10">{tab}</span>
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" 
              />
            )}
          </button>
        ))}
      </div>

      <div className="px-5 py-3 border-b border-white/[0.03] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
           <div className={cn(
             "w-1.5 h-1.5 rounded-full",
             isLoading ? "bg-gray-700 animate-pulse" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
           )} />
           <span className="font-sans text-[10px] text-gray-500 font-bold tracking-[0.1em] uppercase">
             {isLoading ? 'Fetching Sources...' : `${total.toLocaleString()} Channels`}
           </span>
        </div>
      </div>

      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 sidebar-scroll-area"
      >
        {isLoading && total === 0 ? (
          Array.from({ length: 15 }).map((_, i) => <ChannelSkeleton key={i} />)
        ) : (
          <div 
            className="relative w-full"
            style={{ height: total * ITEM_H }}
          >
            <div 
              className="absolute top-0 left-0 right-0"
              style={{ transform: `translateY(${start * ITEM_H}px)` }}
            >
              {visibleItems.map(({ ch, index }) => (
                <ChannelItem
                  key={`${ch.url}-${index}`}
                  channel={ch}
                  index={index}
                  active={curCh?.url === ch.url}
                  isFavorite={isFavorite(ch.url)}
                  onToggleFavorite={onToggleFavorite}
                  onClick={onChannelSelect}
                />
              ))}
              {total === 0 && (
                <div className="flex flex-col items-center justify-center pt-20 text-gray-600 gap-3">
                  <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border border-current opacity-20" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-center px-6">
                    {activeTab === 'favorites' ? 'No Stars Yet' : 'No Channels Found'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
