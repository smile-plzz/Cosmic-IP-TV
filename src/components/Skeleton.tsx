import React from 'react';
import { cn } from '@/src/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-white/[0.05] rounded", className)} />
  );
}

export function ChannelSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 h-[52px] border-b border-white/[0.05]">
      <Skeleton className="w-9 h-9 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-2 w-1/3" />
      </div>
    </div>
  );
}
