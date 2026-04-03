import React, { useState } from 'react';

interface Props {
  onStart: (speed: 1 | 5 | 10) => Promise<void>;
  onStop: () => Promise<void>;
  onReset: () => Promise<void>;
}

export function SimulatorControls({ onStart, onStop, onReset }: Props) {
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<1 | 5 | 10>(1);
  const [loading, setLoading] = useState(false);

  const handleStartStop = async () => {
    setLoading(true);
    if (running) {
      await onStop();
      setRunning(false);
    } else {
      await onStart(speed);
      setRunning(true);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    setLoading(true);
    await onReset();
    setRunning(false);
    setLoading(false);
  };

  return (
    <div className="card p-5">
      <p className="label mb-4">Simulator Controls</p>
      <div className="flex flex-wrap items-center gap-3">
        {/* Speed selector */}
        <div className="flex items-center gap-1 bg-[#0D0D1A] rounded-md p-1">
          {([1, 5, 10] as const).map((s) => (
            <button
              key={s}
              id={`speed-${s}x`}
              disabled={running}
              onClick={() => setSpeed(s)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                speed === s
                  ? 'bg-[#14B8A6] text-[#0D0D1A]'
                  : 'text-[#64748B] hover:text-[#E2E8F0] disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Start/Pause */}
        <button
          id="simulator-start-stop"
          disabled={loading}
          onClick={handleStartStop}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            running
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30'
              : 'bg-[#14B8A6] text-[#0D0D1A] hover:bg-[#0D9488]'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : running ? (
            <>⏸ Pause</>
          ) : (
            <>▶ Start</>
          )}
        </button>

        {/* Reset */}
        <button
          id="simulator-reset"
          disabled={loading}
          onClick={handleReset}
          className="px-4 py-2 rounded-md text-sm font-medium text-[#64748B] border border-[#252540] hover:border-red-500/40 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ↺ Reset
        </button>

        {/* Status indicator */}
        <div className={`flex items-center gap-1.5 ml-auto text-xs font-medium ${running ? 'text-[#14B8A6]' : 'text-[#64748B]'}`}>
          {running && <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse" />}
          {running ? `Running at ${speed}x` : 'Paused'}
        </div>
      </div>
    </div>
  );
}
