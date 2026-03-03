import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts';
import type { NeighborhoodCollection } from '../types';
import { getScoreColor } from '../utils';

interface Props {
  data: NeighborhoodCollection;
}

export default function ScoreDistribution({ data }: Props) {
  const chartData = useMemo(() => {
    const buckets = [
      { range: '0-20', min: 0, max: 20, count: 0 },
      { range: '20-35', min: 20, max: 35, count: 0 },
      { range: '35-50', min: 35, max: 50, count: 0 },
      { range: '50-65', min: 50, max: 65, count: 0 },
      { range: '65+', min: 65, max: 100, count: 0 },
    ];

    for (const f of data.features) {
      const score = f.properties.composite_score;
      for (const bucket of buckets) {
        if (score >= bucket.min && score < bucket.max) {
          bucket.count++;
          break;
        }
        if (bucket.max === 100 && score >= bucket.min) {
          bucket.count++;
          break;
        }
      }
    }

    return buckets;
  }, [data]);

  return (
    <div className="px-3 py-2 border-b border-slate-700">
      <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-1">
        Score Distribution
      </div>
      <div style={{ width: '100%', height: 60 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} barCategoryGap="20%">
            <XAxis
              dataKey="range"
              tick={{ fill: '#64748b', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 6,
                color: '#e2e8f0',
                fontSize: 11,
              }}
              formatter={(value: any) => [`${value} neighborhoods`, 'Count']}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={getScoreColor(entry.min + 10)}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
