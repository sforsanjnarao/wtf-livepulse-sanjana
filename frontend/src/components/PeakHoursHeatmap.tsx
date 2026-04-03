import React from 'react';
import type { HourlyStat } from '../types/index';

interface Props {
  data: HourlyStat[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5am to 10pm

function getColor(count: number, max: number): string {
  if (max === 0 || count === 0) return 'bg-[#1C1C2E]';
  const intensity = count / max;
  if (intensity > 0.8) return 'bg-[#14B8A6]';
  if (intensity > 0.6) return 'bg-[#14B8A6]/80';
  if (intensity > 0.4) return 'bg-[#14B8A6]/55';
  if (intensity > 0.2) return 'bg-[#14B8A6]/30';
  return 'bg-[#14B8A6]/10';
}

export function PeakHoursHeatmap({ data }: Props) {
  // Build lookup map: dow -> hour -> count
  const lookup: Record<number, Record<number, number>> = {};
  let max = 0;
  for (const row of data) {
    if (!lookup[row.day_of_week]) lookup[row.day_of_week] = {};
    lookup[row.day_of_week][row.hour_of_day] = Number(row.checkin_count);
    if (row.checkin_count > max) max = Number(row.checkin_count);
  }

  return (
    <div className="card p-5">
      <p className="label mb-4">Peak Hours Heatmap (7-day)</p>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour axis */}
          <div className="flex mb-1 ml-10">
            {HOURS.map(h => (
              <div key={h} className="flex-1 text-center text-[10px] text-[#64748B]">
                {h % 2 === 0 ? `${h > 12 ? h - 12 : h}${h >= 12 ? 'p' : 'a'}` : ''}
              </div>
            ))}
          </div>

          {/* Rows: per day */}
          {DAYS.map((day, dow) => (
            <div key={dow} className="flex items-center mb-1">
              <span className="text-[10px] text-[#64748B] w-9 text-right pr-2">{day}</span>
              {HOURS.map(hour => {
                const count = lookup[dow]?.[hour] ?? 0;
                return (
                  <div
                    key={hour}
                    className={`flex-1 mx-0.5 h-6 rounded-sm ${getColor(count, max)} transition-all`}
                    title={`${day} ${hour}:00 — ${count} check-ins`}
                  />
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-[10px] text-[#64748B]">Low</span>
            {[0.1, 0.3, 0.55, 0.8, 1.0].map((v, i) => (
              <div key={i} className={`w-5 h-3 rounded-sm ${getColor(Math.round(v * max), max)}`} />
            ))}
            <span className="text-[10px] text-[#64748B]">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}
