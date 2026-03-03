import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { NeighborhoodProperties } from '../types';
import { getScoreColor } from '../utils';

interface Props {
  data: NeighborhoodProperties;
}

export default function RadarChart({ data }: Props) {
  const chartData = [
    { dimension: 'Complaints', score: data.complaint_density_score, fullName: 'Complaint Density' },
    { dimension: 'Environment', score: data.environmental_risk_score, fullName: 'Environmental Risk' },
    { dimension: 'Emergency', score: data.emergency_coverage_score, fullName: 'Emergency Coverage Gap' },
    { dimension: 'Resources', score: data.resource_access_score, fullName: 'Resource Access Gap' },
  ];

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <RechartsRadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={{ fill: '#475569', fontSize: 9 }}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#e2e8f0',
              fontSize: 12,
            }}
            formatter={(value: any, _: any, entry: any) => [
              `${value.toFixed(1)} / 100`,
              entry.payload.fullName,
            ]}
          />
          <Radar
            name="Risk Score"
            dataKey="score"
            stroke={getScoreColor(data.composite_score)}
            fill={getScoreColor(data.composite_score)}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
