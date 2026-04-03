import React from 'react';

interface Props {
  connected: boolean;
}

export function LiveIndicator({ connected }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`relative flex h-2.5 w-2.5`}
      >
        {connected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            connected ? 'bg-[#14B8A6]' : 'bg-red-500'
          }`}
        />
      </span>
      <span className={`text-xs font-medium ${connected ? 'text-[#14B8A6]' : 'text-red-400'}`}>
        {connected ? 'LIVE' : 'OFFLINE'}
      </span>
    </div>
  );
}
