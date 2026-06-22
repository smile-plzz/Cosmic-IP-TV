import React, { useState, useEffect } from 'react';
import { Search, RefreshCcw, LayoutGrid, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface HeaderProps {
  onSearch: (val: string) => void;
  onRefresh: () => void;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  totalCount: number;
  isRefreshing: boolean;
  verifyingCount: number;
  selectedCategory: string;
  initialSearch?: string;
}

export function Header({ 
  onSearch, 
  onRefresh, 
  onCategoryChange, 
  categories, 
  totalCount,
  isRefreshing,
  verifyingCount,
  selectedCategory,
  initialSearch = ''
}: HeaderProps) {
  const [searchValue, setSearchValue] = useState(initialSearch);

  useEffect(() => {
    setSearchValue(initialSearch);
  }, [initialSearch]);

  const handleSearchChange = (val: string) => {
    setSearchValue(val);
    onSearch(val);
  };

  const handleClear = () => {
    setSearchValue('');
    onSearch('');
  };

  return (
    <header className="h-[56px] bg-[#12151c]/80 backdrop-blur-md border-b border-white/[0.05] flex items-center px-4 lg:px-6 gap-4 lg:gap-6 flex-shrink-0 z-50">
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
        <h1 className="text-sm font-bold tracking-[0.15em] text-white uppercase font-sans">
          Cosmic <span className="text-emerald-500">Live</span>
        </h1>
      </div>

      <div className="flex-1 max-w-lg relative group">
        <div className="absolute inset-0 bg-emerald-500/5 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none z-0" />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none transition-colors group-focus-within:text-emerald-500 z-20" />
        <input 
          type="text" 
          value={searchValue}
          placeholder="Search channels..."
          className="relative z-10 w-full h-10 bg-white/[0.03] border border-white/5 rounded-lg pl-10 pr-10 text-[13px] text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.05] transition-all font-sans cursor-text"
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        {searchValue && (
          <button 
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white cursor-pointer z-30 flex items-center justify-center bg-transparent"
            type="button"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <div className="relative group flex-shrink-0 hidden md:block">
           <select 
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="h-9 bg-white/[0.03] border border-white/5 rounded-lg pl-3 pr-8 text-[11px] font-mono text-gray-400 outline-none cursor-pointer appearance-none hover:border-white/10 hover:bg-white/[0.05] transition-all w-[180px] uppercase tracking-wider"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat} className="bg-[#12151c]">{cat}</option>
            ))}
          </select>
          <LayoutGrid className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none group-hover:text-emerald-500 transition-colors" />
        </div>

        <div className="h-4 w-px bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end hidden sm:flex">
            {verifyingCount > 0 ? (
              <>
                <span className="font-mono text-[10px] text-orange-400/90 font-bold leading-none">
                  {verifyingCount}
                </span>
                <span className="font-mono text-[7px] text-gray-500 uppercase tracking-[0.2em] mt-1">
                  Verifying...
                </span>
              </>
            ) : (
              <>
                <span className="font-mono text-[10px] text-emerald-400 font-bold leading-none">
                  {totalCount.toLocaleString()}
                </span>
                <span className="font-mono text-[7px] text-gray-600 uppercase tracking-[0.2em] mt-1">
                  Live Sources
                </span>
              </>
            )}
          </div>
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              "w-10 h-10 flex items-center justify-center bg-white/[0.03] border border-white/5 rounded-full text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all active:scale-90 cursor-pointer",
              isRefreshing && "opacity-50 cursor-not-allowed"
            )}
            title="Refresh Index"
          >
            <RefreshCcw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </button>
        </div>
      </div>
    </header>
  );
}
