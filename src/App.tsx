/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Channel, ActiveTab } from './types';
import { parseM3U } from './lib/iptv';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { VideoPlayer } from './components/VideoPlayer';
import { Volume2, VolumeX, Maximize2, Monitor } from 'lucide-react';
import { cn, flag, initials } from './lib/utils';
import { motion } from 'motion/react';

const INDEX_URL = 'https://iptv-org.github.io/iptv/index.m3u';

export default function App() {
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [recentChannels, setRecentChannels] = useState<Channel[]>([]);
  const [curCh, setCurCh] = useState<Channel | null>(null);
  const [curIdx, setCurIdx] = useState(-1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'player'>('list');
  const [hideBroken, setHideBroken] = useState(true);
  const [blacklistedUrls, setBlacklistedUrls] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('blacklisted_channels');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Fetch Logic
  const fetchChannels = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const response = await fetch(`${INDEX_URL}?_=${Date.now()}`);
      const text = await response.text();
      const parsed = parseM3U(text);
      setAllChannels(parsed);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
    // Restore state
    const savedLast = localStorage.getItem('last_channel');
    if (savedLast) {
      try {
        const ch = JSON.parse(savedLast);
        setCurCh(ch);
      } catch(e) {}
    }
    const savedRecent = localStorage.getItem('recent_channels');
    if (savedRecent) {
      try { setRecentChannels(JSON.parse(savedRecent)); } catch(e) {}
    }
  }, [fetchChannels]);

  // Filtering Logic
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    const result = allChannels.filter(ch => {
      if (hideBroken && blacklistedUrls[ch.url]) {
        return false;
      }
      const matchesSearch = !query || 
        ch.name.toLowerCase().includes(query) || 
        (ch.country && ch.country.includes(query)) ||
        (ch.category && ch.category.toLowerCase().includes(query));
      
      const matchesCategory = !selectedCategory || ch.category === selectedCategory;
      const matchesCountry = !selectedCountry || ch.country === selectedCountry;

      return matchesSearch && matchesCategory && matchesCountry;
    });
    setFilteredChannels(result);
  }, [allChannels, searchQuery, selectedCategory, selectedCountry, hideBroken, blacklistedUrls]);

  // Derived State
  const categories = useMemo(() => {
    const set = new Set(allChannels.map(c => c.category).filter(Boolean));
    return Array.from(set).sort();
  }, [allChannels]);

  const countries = useMemo(() => {
    const counts: Record<string, number> = {};
    allChannels.forEach(ch => {
      // Don't count blacklisted ones if they are hidden
      if (hideBroken && blacklistedUrls[ch.url]) return;
      if (ch.country) counts[ch.country] = (counts[ch.country] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([code]) => code);
  }, [allChannels, hideBroken, blacklistedUrls]);

  const blacklistedCount = useMemo(() => {
    return Object.keys(blacklistedUrls).length;
  }, [blacklistedUrls]);

  // Handlers
  const handlePlayError = useCallback((url: string) => {
    setBlacklistedUrls(prev => {
      const next = { ...prev, [url]: true };
      localStorage.setItem('blacklisted_channels', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleChannelSelect = useCallback((ch: Channel, idx: number) => {
    setCurCh(ch);
    setCurIdx(idx);
    
    // Update Recent
    setRecentChannels(prev => {
      const next = [ch, ...prev.filter(c => c.url !== ch.url)].slice(0, 40);
      localStorage.setItem('recent_channels', JSON.stringify(next));
      return next;
    });
    
    localStorage.setItem('last_channel', JSON.stringify(ch));
    setMobileView('player');
  }, []);

  const handleNext = useCallback(() => {
    if (filteredChannels.length === 0) return;
    const nextIdx = (curIdx + 1) % filteredChannels.length;
    handleChannelSelect(filteredChannels[nextIdx], nextIdx);
  }, [filteredChannels, curIdx, handleChannelSelect]);

  return (
    <div className="flex flex-col h-screen bg-[#0b0d11] text-gray-200 overflow-hidden font-sans selection:bg-emerald-500/30 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Header 
        onSearch={setSearchQuery}
        onRefresh={() => fetchChannels()}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        totalCount={allChannels.length}
        isRefreshing={isRefreshing}
        selectedCategory={selectedCategory}
      />

      {/* Country Ribbon */}
      <div className="h-11 border-b border-white/[0.05] bg-[#12151c]/50 backdrop-blur-sm flex items-center px-6 gap-3 overflow-x-auto scrollbar-none flex-shrink-0 justify-between">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 mr-3 border-r border-white/10 pr-3 py-1 flex-shrink-0">
            <Monitor className="w-3 h-3 text-gray-600" />
            <span className="font-mono text-[9px] text-gray-600 uppercase font-bold tracking-widest">Regions</span>
          </div>
          <button 
            onClick={() => setSelectedCountry('')}
            className={cn(
              "px-3 py-1.5 rounded-md font-mono text-[10px] border transition-all flex-shrink-0 uppercase font-bold tracking-wider cursor-pointer",
              selectedCountry === '' 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                : "bg-white/[0.03] border-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.05]"
            )}
          >
            All
          </button>
          {countries.map(code => (
            <button 
              key={code}
              onClick={() => setSelectedCountry(code)}
              className={cn(
                "px-3 py-1.5 rounded-md font-mono text-[10px] border transition-all flex-shrink-0 flex items-center gap-2 uppercase font-bold tracking-wider cursor-pointer",
                selectedCountry === code 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                  : "bg-white/[0.03] border-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.05]"
              )}
            >
              <span className="text-xs">{flag(code)}</span>
              <span>{code}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Blacklist / Broken filter control */}
        {blacklistedCount > 0 && (
          <div className="flex items-center gap-2 pl-4 border-l border-white/10 flex-shrink-0 text-xs py-1">
            <button 
              onClick={() => setHideBroken(!hideBroken)}
              className={cn(
                "px-2.5 py-1 rounded-md border text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer font-bold",
                hideBroken 
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20" 
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
              )}
              title={hideBroken ? "Show flagged broken streams" : "Hide flagged broken streams"}
            >
              {hideBroken ? `Filtered Dead (${blacklistedCount})` : `Hiding Disabled (${blacklistedCount})`}
            </button>
            <button
              onClick={() => {
                setBlacklistedUrls({});
                localStorage.removeItem('blacklisted_channels');
              }}
              className="px-2 py-1 text-gray-500 hover:text-red-400 text-[10px] font-mono uppercase transition-colors cursor-pointer font-bold bg-white/[0.02] border border-white/5 rounded-md hover:border-red-500/20"
              title="Reset all failure flags"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Mobile Tab Control — Only visible below 'lg' */}
      <div className="flex lg:hidden bg-[#12151c] border-b border-white/[0.05] h-12 flex-shrink-0">
        <button
          onClick={() => setMobileView('list')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest relative cursor-pointer",
            mobileView === 'list' ? "text-emerald-400 bg-white/[0.01]" : "text-gray-500 hover:text-gray-300"
          )}
        >
          <span>Channels ({filteredChannels.length})</span>
          {mobileView === 'list' && (
            <motion.div 
              layoutId="mobileActiveTab" 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
            />
          )}
        </button>
        <button
          onClick={() => setMobileView('player')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest relative cursor-pointer",
            mobileView === 'player' ? "text-emerald-400 bg-white/[0.01]" : "text-gray-500 hover:text-gray-300"
          )}
        >
          <span>Player {curCh ? `• ${curCh.name}` : ''}</span>
          {mobileView === 'player' && (
            <motion.div 
              layoutId="mobileActiveTab" 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
            />
          )}
        </button>
      </div>

      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
        {/* On mobile: Hide Sidebar when not in list mode */}
        <div className={cn(
          "lg:flex flex-col h-full",
          mobileView === 'list' ? "flex w-full h-full" : "hidden lg:flex lg:h-full"
        )}>
          <Sidebar 
            channels={filteredChannels}
            recentChannels={recentChannels}
            curCh={curCh}
            onChannelSelect={handleChannelSelect}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        {/* On mobile: Hide Player when not in player mode */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 bg-black/40 relative h-full",
          mobileView === 'player' ? "flex h-full" : "hidden lg:flex lg:h-full lg:flex-col"
        )}>
          <div className="flex-1 relative min-h-0 bg-black">
            <VideoPlayer 
              channel={curCh}
              onNext={handleNext}
              volume={volume}
              isMuted={isMuted}
              onPlayError={handlePlayError}
            />
            {mobileView === 'player' && (
              <button
                onClick={() => setMobileView('list')}
                className="absolute top-4 left-4 lg:hidden px-3.5 py-2 bg-black/60 hover:bg-black/80 text-white rounded-lg border border-white/10 flex items-center gap-1.5 text-[9px] font-mono uppercase font-bold tracking-wider backdrop-blur-sm z-30 cursor-pointer shadow-lg animate-fade-in"
              >
                ← Channels List
              </button>
            )}
          </div>

          {/* Now Playing Bar */}
          <div className="h-20 border-t border-white/[0.05] bg-[#12151c]/90 backdrop-blur-md flex items-center px-4 lg:px-6 gap-3 lg:gap-5 flex-shrink-0 group">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-black/60 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-emerald-500/30 transition-colors">
              {curCh?.logo ? (
                <img src={curCh.logo} alt="" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
              ) : (
                <Monitor className="w-5 h-5 text-gray-700" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs lg:text-[15px] font-bold text-white truncate leading-tight tracking-tight">
                  {curCh?.name || "No Channel Selected"}
                </h2>
                {curCh && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-[7px] lg:text-[8px] font-bold uppercase tracking-[0.2em] px-1.5 py-0.5 rounded border border-emerald-500/20 flex-shrink-0">
                    Live
                  </span>
                )}
              </div>
              <p className="text-[9px] lg:text-[10px] font-mono text-gray-500 truncate mt-1 uppercase tracking-[0.15em] font-medium leading-none">
                {curCh ? `${curCh.category || 'General'} · ${curCh.country?.toUpperCase() || 'Global'}` : "Select a stream to begin"}
              </p>
            </div>

            <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-3 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-lg group/container">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <div className="w-20 h-1 bg-white/5 rounded-full relative group/vol cursor-pointer">
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => {
                      setVolume(parseInt(e.target.value));
                      if (isMuted) setIsMuted(false);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute top-0 left-0 h-full bg-emerald-500 transition-all pointer-events-none" 
                    style={{ width: `${volume}%` }}
                  />
                </div>
              </div>

              <div className={cn(
                "px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-lg border font-mono text-[8.5px] lg:text-[9px] font-bold uppercase tracking-[0.2em] transition-all flex-shrink-0",
                curCh 
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]" 
                  : "bg-white/[0.02] border-white/10 text-gray-600"
              )}>
                {curCh ? "Tuned In" : "Standby"}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
