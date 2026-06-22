/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Channel, ActiveTab } from './types';
import { VideoPlayer } from './components/VideoPlayer';
import { Volume2, VolumeX, Monitor, Settings2, X } from 'lucide-react';
import { cn, flag, countryName } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useIPTV } from './hooks/useIPTV';
import { useBlacklist } from './hooks/useBlacklist';
import { useFavorites } from './hooks/useFavorites';
import { useLivenessTracker } from './hooks/useBackgroundScanner';

export default function App() {
  const { allChannels, categories, isLoading, fetchChannels } = useIPTV();
  const { blacklistedUrls, blacklistUrl, clearBlacklist } = useBlacklist();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  
  // Background Liveness Scanning
  const { offlineUrls, queueSize } = useLivenessTracker(allChannels, blacklistUrl, true);

  const [curCh, setCurCh] = useState<Channel | null>(null);
  const [curIdx, setCurIdx] = useState(-1);
  const [recentChannels, setRecentChannels] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem('recent_channels');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'player'>('list');
  const [hideBroken, setHideBroken] = useState(true);
  const [autoNext, setAutoNext] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const [sortBy, setSortBy] = useState<'priority' | 'name'>('priority');

  // Helper to switch to list view on filter change on mobile
  const onFilterChange = useCallback(() => {
    if (window.innerWidth < 1024) {
      setMobileView('list');
    }
    // Scroll list to top
    const listElement = document.querySelector('.sidebar-scroll-area');
    if (listElement) listElement.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    onFilterChange();
  }, [onFilterChange]);

  const handleCategorySelect = useCallback((cat: string) => {
    setSelectedCategory(cat);
    onFilterChange();
  }, [onFilterChange]);

  const handleCountrySelect = useCallback((code: string) => {
    setSelectedCountry(code);
    onFilterChange();
  }, [onFilterChange]);

  // Priority Scoring
  const getPriority = useCallback((ch: Channel) => {
    let score = 0;
    const name = (ch.name || '').toUpperCase();
    if (name.includes('HD') || name.includes('4K') || name.includes('FHD') || name.includes('UHD')) score += 10;
    if (name.includes('PLUS') || name.includes('PREMIUM') || name.includes('VIP') || name.includes('PRO') || name.includes('OFFICIAL')) score += 8;
    if (isFavorite(ch.url)) score += 30;
    if (ch.logo) score += 5;
    // Boost channels that match the current category/country strictly
    if (selectedCategory && ch.category === selectedCategory) score += 2;
    return score;
  }, [isFavorite, selectedCategory]);

  // Filtering & Sorting Logic
  const filteredChannels = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = allChannels.filter(ch => {
      // Permanent blacklist check
      if (hideBroken && blacklistedUrls[ch.url]) {
        return false;
      }
      // Session offline check
      if (hideBroken && offlineUrls[ch.url]) {
        return false;
      }
      const matchesSearch = !query || 
        (ch.name && ch.name.toLowerCase().includes(query)) ||
        (ch.country && ch.country.toLowerCase().includes(query)) ||
        (ch.category && ch.category.toLowerCase().includes(query));
      
      const matchesCategory = !selectedCategory || ch.category === selectedCategory;
      const chCountries = (ch.country || '').split(';').map(c => c.trim().toLowerCase());
      const matchesCountry = !selectedCountry || chCountries.includes(selectedCountry);
      
      return matchesSearch && matchesCategory && matchesCountry;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'priority') {
        const pA = getPriority(a);
        const pB = getPriority(b);
        if (pA !== pB) return pB - pA;
      }
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [allChannels, searchQuery, selectedCategory, selectedCountry, hideBroken, blacklistedUrls, sortBy, getPriority]);

  const countries = useMemo(() => {
    const counts: Record<string, number> = {};
    allChannels.forEach(ch => {
      if (hideBroken && blacklistedUrls[ch.url]) return;
      if (ch.country) {
        const codes = ch.country.split(';').map(c => c.trim().toLowerCase()).filter(Boolean);
        codes.forEach(code => {
          counts[code] = (counts[code] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .filter(([code]) => code.length >= 2 && code.length <= 3) // ISO codes
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([code]) => code);
  }, [allChannels, hideBroken, blacklistedUrls]);

  const blacklistedCount = useMemo(() => {
    return Object.keys(blacklistedUrls).length;
  }, [blacklistedUrls]);

  const handleChannelSelect = useCallback((ch: Channel, idx: number) => {
    setCurCh(ch);
    setCurIdx(idx);
    
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

  const handlePrev = useCallback(() => {
    if (filteredChannels.length === 0) return;
    const nextIdx = (curIdx - 1 + filteredChannels.length) % filteredChannels.length;
    handleChannelSelect(filteredChannels[nextIdx], nextIdx);
  }, [filteredChannels, curIdx, handleChannelSelect]);

  const handlePlayError = useCallback((url: string) => {
    blacklistUrl(url);
    if (autoNext) {
      setTimeout(() => handleNext(), 1500);
    }
  }, [blacklistUrl, autoNext, handleNext]);

  return (
    <div className="flex flex-col h-screen bg-[#0b0d11] text-gray-200 overflow-hidden font-sans selection:bg-emerald-500/30 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Header 
        onSearch={handleSearch}
        onRefresh={() => fetchChannels()}
        onCategoryChange={handleCategorySelect}
        categories={categories}
        totalCount={allChannels.length}
        isRefreshing={isLoading}
        verifyingCount={queueSize}
        selectedCategory={selectedCategory}
        initialSearch={searchQuery}
      />

      {/* Country Ribbon */}
      <div className="h-12 border-b border-white/[0.05] bg-[#0b0d11] flex items-center px-4 lg:px-6 gap-3 flex-shrink-0 justify-between relative z-[70]">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 mr-4 border-r border-white/5 pr-4 py-1.5 flex-shrink-0 select-none">
            <Monitor className="w-3 h-3 text-emerald-500/60" />
            <span className="font-sans text-[9px] text-gray-500 uppercase font-bold tracking-[0.1em]">Regions</span>
          </div>
          <button 
            onClick={() => handleCountrySelect('')}
            className={cn(
              "px-4 py-1.5 rounded-full font-sans text-[9px] border transition-all flex-shrink-0 uppercase font-bold tracking-widest cursor-pointer",
              selectedCountry === '' 
                ? "bg-emerald-500 border-emerald-500 text-[#0b0d11] shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                : "bg-white/[0.03] border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]"
            )}
          >
            All
          </button>
          {countries.map(code => (
            <button 
              key={code}
              onClick={() => handleCountrySelect(code)}
              className={cn(
                "px-4 py-1.5 rounded-full font-sans text-[9px] border transition-all flex-shrink-0 flex items-center gap-2 font-bold tracking-tight whitespace-nowrap cursor-pointer",
                selectedCountry === code 
                  ? "bg-emerald-500 border-emerald-500 text-[#0b0d11] shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                  : "bg-white/[0.03] border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]"
              )}
            >
              <span className="text-base leading-none">{flag(code)}</span>
              <span className="uppercase tracking-widest">{countryName(code)}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 pl-6 border-l border-white/5 flex-shrink-0">
          {(searchQuery || selectedCategory || selectedCountry) && (
            <button
               onClick={() => {
                 setSearchQuery('');
                 setSelectedCategory('');
                 setSelectedCountry('');
               }}
               className="text-[9px] font-sans font-bold uppercase tracking-widest text-red-500/50 hover:text-red-400 transition-colors mr-3 cursor-pointer"
            >
              Reset
            </button>
          )}
          
          <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-lg px-2.5 py-1.5">
            <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Sort</span>
            <button 
              onClick={() => setSortBy(sortBy === 'priority' ? 'name' : 'priority')}
              className="text-[9px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer uppercase tracking-widest font-mono"
            >
              {sortBy}
            </button>
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "p-2 rounded-lg border transition-all cursor-pointer",
              showSettings ? "bg-emerald-500 border-emerald-500 text-[#0b0d11]" : "bg-white/[0.03] border-white/10 text-gray-500 hover:text-white"
            )}
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#1a1d25] border-b border-white/10 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Auto-skip Broken</span>
                <button 
                  onClick={() => setAutoNext(!autoNext)}
                  className={cn(
                    "w-8 h-4 rounded-full relative transition-colors cursor-pointer",
                    autoNext ? "bg-emerald-500" : "bg-gray-700"
                  )}
                >
                  <motion.div 
                    animate={{ x: autoNext ? 16 : 2 }}
                    className="absolute top-1 w-2 h-2 rounded-full bg-white shadow-sm" 
                  />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Hide Flagged Streams</span>
                <button 
                  onClick={() => setHideBroken(!hideBroken)}
                  className={cn(
                    "w-8 h-4 rounded-full relative transition-colors cursor-pointer",
                    hideBroken ? "bg-amber-500" : "bg-gray-700"
                  )}
                >
                  <motion.div 
                    animate={{ x: hideBroken ? 16 : 2 }}
                    className="absolute top-1 w-2 h-2 rounded-full bg-white shadow-sm" 
                  />
                </button>
              </div>

              {blacklistedCount > 0 && (
                <button
                  onClick={clearBlacklist}
                  className="px-3 py-1 bg-red-500/10 text-red-400 text-[9px] font-bold uppercase border border-red-500/20 rounded hover:bg-red-500/20 cursor-pointer"
                >
                  Reset Playback Flags ({blacklistedCount})
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            favoriteChannels={favorites}
            curCh={curCh}
            onChannelSelect={handleChannelSelect}
            onToggleFavorite={toggleFavorite}
            isFavorite={isFavorite}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isLoading={isLoading}
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
