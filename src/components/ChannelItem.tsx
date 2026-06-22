import React from 'react';
import { Channel } from '@/src/types';
import { cn, initials, flag } from '@/src/lib/utils';
import { motion } from 'motion/react';

import { Heart } from 'lucide-react';

interface ChannelItemProps {
  channel: Channel;
  index: number;
  active: boolean;
  isFavorite: boolean;
  onToggleFavorite: (channel: Channel) => void;
  onClick: (channel: Channel, index: number) => void;
  style?: React.CSSProperties;
}

const LiveBars = () => (
  <div className="flex items-end gap-[1px] h-2.5 w-3">
    <motion.div
      animate={{ height: ["20%", "100%", "20%"] }}
      transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
      className="w-0.5 bg-emerald-400"
    />
    <motion.div
      animate={{ height: ["40%", "80%", "40%"] }}
      transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
      className="w-0.5 bg-emerald-400"
    />
    <motion.div
      animate={{ height: ["100%", "30%", "100%"] }}
      transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
      className="w-0.5 bg-emerald-400"
    />
  </div>
);

export const ChannelItem = React.memo(({ channel, active, onClick, onToggleFavorite, isFavorite, index, style }: ChannelItemProps) => {
  const isHD = (ch: Channel) => {
    const q = (ch.quality || '').toLowerCase();
    const n = (ch.name || '').toLowerCase();
    return q.includes('hd') || q.includes('720') || q.includes('1080') || /\bhd\b/.test(n);
  };

  return (
    <div 
      style={style}
      className={cn(
        "flex items-center gap-3 px-4 h-[52px] cursor-pointer transition-colors border-b border-white/[0.05] group select-none relative",
        active ? "bg-emerald-500/[0.08]" : "hover:bg-white/[0.02]"
      )}
      onClick={() => onClick(channel, index)}
    >
      <div className="relative w-9 h-9 flex-shrink-0">
        {channel.logo ? (
          <img 
            src={channel.logo} 
            alt="" 
            className="w-full h-full object-contain rounded-md border border-white/10 bg-gray-900"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
            referrerPolicy="no-referrer"
          />
        ) : null}
        <div className={cn(
          "w-full h-full rounded-md border border-white/10 bg-gray-800 flex items-center justify-center text-[10px] font-mono text-gray-500 font-medium font-bold",
          channel.logo ? "hidden" : "flex"
        )}>
          {initials(channel.name)}
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-hidden pr-8">
        <div className="flex items-center justify-between gap-2">
          <div className={cn(
            "text-[13px] font-medium truncate leading-tight",
            active ? "text-emerald-400 font-bold" : "text-gray-200 group-hover:text-white"
          )}>
            {channel.name}
          </div>
          {active && <LiveBars />}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
          {channel.country && (
            <span className="text-[9px] font-mono text-gray-500 bg-black/40 border border-white/10 px-1.5 py-0 rounded flex items-center gap-1 uppercase truncate max-w-[80px]">
              {flag(channel.country)} {channel.country}
            </span>
          )}
          {channel.category && (
            <span className="text-[9px] font-mono text-gray-500 bg-black/40 border border-white/10 px-1.5 py-0 rounded truncate max-w-[80px]">
              {channel.category}
            </span>
          )}
          {isHD(channel) && (
            <span className="text-[9px] font-mono text-emerald-500 font-semibold flex-shrink-0">HD</span>
          )}
        </div>
      </div>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(channel);
        }}
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer",
          isFavorite ? "opacity-100 text-pink-500" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
        )}
      >
        <Heart className={cn("w-3.5 h-3.5 transition-transform active:scale-125", isFavorite && "fill-current")} />
      </button>
    </div>
  );
});

ChannelItem.displayName = 'ChannelItem';
