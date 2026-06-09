'use client';

import { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { BarChart3, LineChart } from 'lucide-react';

interface HistoryPoint {
  date: string;
  pos: number;
  clicks: number;
  impressions: number;
}

interface KeywordHistoryChartProps {
  history: HistoryPoint[];
}

export default function KeywordHistoryChart({ history }: KeywordHistoryChartProps) {
  const [metric, setMetric] = useState<'position' | 'traffic'>('position');

  // Format data
  const data = history.map(h => ({
    date: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    pos: h.pos,
    clicks: h.clicks,
    impressions: h.impressions
  }));

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {metric === 'position' ? <LineChart className="text-brand-primary" size={16} /> : <BarChart3 className="text-brand-purple" size={16} />}
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Rank & Traffic History (Last 30 Days)</h3>
        </div>

        <div className="flex bg-brand-bg rounded-lg p-0.5 border border-brand-border">
          <button
            onClick={() => setMetric('position')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
              metric === 'position' ? 'bg-brand-primary text-white' : 'text-brand-muted hover:text-white'
            }`}
          >
            Rank Position
          </button>
          <button
            onClick={() => setMetric('traffic')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
              metric === 'traffic' ? 'bg-brand-purple text-white' : 'text-brand-muted hover:text-white'
            }`}
          >
            GSC Traffic
          </button>
        </div>
      </div>

      <div className="h-[280px] w-full pt-4 font-mono text-xs">
        <ResponsiveContainer width="100%" height="100%">
          {metric === 'position' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F6EF7" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#4F6EF7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2E3350" strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
              {/* Inverted Y-Axis: Rank #1 is better than #100 */}
              <YAxis 
                stroke="#64748B" 
                fontSize={10} 
                tickLine={false} 
                reversed
                domain={[1, 'auto']} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#21253A', borderColor: '#2E3350', borderRadius: '12px' }}
                labelStyle={{ color: '#E2E8F0', fontFamily: 'monospace' }}
                itemStyle={{ color: '#4F6EF7' }}
                formatter={(value) => [`#${value}`, 'Avg Position']}
              />
              <Area type="monotone" dataKey="pos" stroke="#4F6EF7" strokeWidth={2} fillOpacity={1} fill="url(#colorPos)" />
            </AreaChart>
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2E3350" strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#21253A', borderColor: '#2E3350', borderRadius: '12px' }}
                labelStyle={{ color: '#E2E8F0', fontFamily: 'monospace' }}
                itemStyle={{ color: '#A855F7' }}
              />
              <Area type="monotone" dataKey="clicks" name="GSC Clicks" stroke="#A855F7" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
