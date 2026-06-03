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
      const matchesSearch = !query || 
        ch.name.toLowerCase().includes(query) || 
        (ch.country && ch.country.includes(query)) ||
        (ch.category && ch.category.toLowerCase().includes(query));
      
      const matchesCategory = !selectedCategory || ch.category === selectedCategory;
      const matchesCountry = !selectedCountry || ch.country === selectedCountry;

      return matchesSearch && matchesCategory && matchesCountry;
    });
    setFilteredChannels(result);
  }, [allChannels, searchQuery, selectedCategory, selectedCountry]);

  // Derived State
  const categories = useMemo(() => {
    const set = new Set(allChannels.map(c => c.category).filter(Boolean));
    return Array.from(set).sort();
  }, [allChannels]);

  const countries = useMemo(() => {
    const counts: Record<string, number> = {};
    allChannels.forEach(ch => {
      if (ch.country) counts[ch.country] = (counts[ch.country] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([code]) => code);
  }, [allChannels]);

  // Handlers
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
      <div className="h-11 border-b border-white/[0.05] bg-[#12151c]/50 backdrop-blur-sm flex items-center px-6 gap-3 overflow-x-auto scrollbar-none flex-shrink-0">
        <div className="flex items-center gap-2 mr-3 border-r border-white/10 pr-3 py-1 flex-shrink-0">
          <Monitor className="w-3 h-3 text-gray-600" />
          <span className="font-mono text-[9px] text-gray-600 uppercase font-bold tracking-widest">Regions</span>
        </div>
        <button 
          onClick={() => setSelectedCountry('')}
          className={cn(
            "px-3 py-1.5 rounded-md font-mono text-[10px] border transition-all flex-shrink-0 uppercase font-bold tracking-wider",
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
              "px-3 py-1.5 rounded-md font-mono text-[10px] border transition-all flex-shrink-0 flex items-center gap-2 uppercase font-bold tracking-wider",
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

      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <Sidebar 
          channels={filteredChannels}
          recentChannels={recentChannels}
          curCh={curCh}
          onChannelSelect={handleChannelSelect}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className="flex-1 flex flex-col min-w-0 bg-black/40 relative">
          <div className="flex-1 min-h-[300px] lg:min-h-0">
            <VideoPlayer 
              channel={curCh}
              onNext={handleNext}
              volume={volume}
              isMuted={isMuted}
            />
          </div>

          {/* Now Playing Bar */}
          <div className="h-20 border-t border-white/[0.05] bg-[#12151c]/90 backdrop-blur-md flex items-center px-6 gap-5 flex-shrink-0 group">
            <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-emerald-500/30 transition-colors">
              {curCh?.logo ? (
                <img src={curCh.logo} alt="" className="w-full h-full object-contain p-1" />
              ) : (
                <Monitor className="w-6 h-6 text-gray-700" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-white truncate leading-tight tracking-tight">
                  {curCh?.name || "No Channel Selected"}
                </h2>
                {curCh && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase tracking-[0.2em] px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Live
                  </span>
                )}
              </div>
              <p className="text-[10px] font-mono text-gray-500 truncate mt-1 uppercase tracking-[0.15em] font-medium">
                {curCh ? `${curCh.category || 'General'} · ${curCh.country?.toUpperCase() || 'Global'}` : "Select a stream to begin"}
              </p>
            </div>

            <div className="flex items-center gap-6 flex-shrink-0">
              <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-lg group/container">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="hover:text-emerald-400 transition-colors"
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
                    className="absolute top-0 left-0 h-full bg-emerald-500 transition-all" 
                    style={{ width: `${volume}%` }}
                  />
                </div>
              </div>

              <div className={cn(
                "px-3 py-1.5 rounded-lg border font-mono text-[9px] font-bold uppercase tracking-[0.2em] transition-all",
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
