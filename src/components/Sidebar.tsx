import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Channel, ActiveTab } from '@/src/types';
import { ChannelItem } from './ChannelItem';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface SidebarProps {
  channels: Channel[];
  recentChannels: Channel[];
  curCh: Channel | null;
  onChannelSelect: (ch: Channel, idx: number) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const ITEM_H = 52;
const OVERSCAN = 10;

export function Sidebar({ channels, recentChannels, curCh, onChannelSelect, activeTab, setActiveTab }: SidebarProps) {
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
    if (activeTab === 'hd') {
       return channels.filter(ch => {
        const q = (ch.quality || '').toLowerCase();
        const n = (ch.name || '').toLowerCase();
        return q.includes('hd') || q.includes('720') || q.includes('1080') || /\bhd\b/.test(n);
      });
    }
    return channels;
  }, [activeTab, channels, recentChannels]);

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
    <div className="w-full lg:w-[292px] h-full flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/[0.07] bg-[#12151c] flex flex-col overflow-hidden">
      <div className="flex border-b border-white/[0.05] flex-shrink-0 bg-black/20">
        {(['all', 'hd', 'recent'] as ActiveTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-4 text-[10px] font-bold tracking-[0.2em] uppercase transition-all relative overflow-hidden group",
              activeTab === tab ? "text-white" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <span className="relative z-10">{tab}</span>
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
              />
            )}
          </button>
        ))}
      </div>

      <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
           <span className="font-mono text-[9px] text-gray-400 font-medium tracking-wider uppercase">{total.toLocaleString()} CHANNELS</span>
        </div>
      </div>

      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10"
      >
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
                onClick={onChannelSelect}
              />
            ))}
            {total === 0 && (
              <div className="flex flex-col items-center justify-center pt-20 text-gray-600 gap-3">
                <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full border border-current opacity-20" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest">No Channels Found</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
