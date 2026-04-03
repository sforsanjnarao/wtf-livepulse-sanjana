import React from 'react';

interface Props {
  rows?: number;
  className?: string;
}

export function SkeletonLoader({ rows = 3, className = '' }: Props) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse flex space-x-3">
          <div className="rounded-full bg-[#252540] h-8 w-8 flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 bg-[#252540] rounded w-3/4" />
            <div className="h-2 bg-[#252540] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-6 animate-pulse ${className}`}>
      <div className="h-3 bg-[#252540] rounded w-1/3 mb-4" />
      <div className="h-10 bg-[#252540] rounded w-1/2 mb-2" />
      <div className="h-2 bg-[#252540] rounded w-1/4" />
    </div>
  );
}
