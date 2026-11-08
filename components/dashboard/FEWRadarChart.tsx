"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#0EA5E9", "#F59E0B", "#22C55E", "#A855F7"];

interface PresetPoint {
  name: string;
  water: number;
  energy: number;
  food: number;
}

export function FEWRadarChart({ data }: { data: PresetPoint[] }) {
  const chartData = [
    {
      metric: "Water",
      ...Object.fromEntries(data.map((d) => [d.name, d.water])),
    },
    {
      metric: "Energy",
      ...Object.fromEntries(data.map((d) => [d.name, d.energy])),
    },
    {
      metric: "Food",
      ...Object.fromEntries(data.map((d) => [d.name, d.food])),
    },
  ];

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
          {data.map((d, i) => (
            <Radar
              key={d.name}
              name={d.name}
              dataKey={d.name}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.25}
            />
          ))}
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const row = payload[0]?.payload as Record<string, unknown>;
              return (
                <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
                  <p className="font-semibold">{String(row.metric)}</p>
                  {data.map((preset, idx) => (
                    <p key={preset.name}>
                      <span style={{ color: COLORS[idx % COLORS.length] }}>
                        {preset.name}:{" "}
                      </span>
                      {Number(row[preset.name]).toFixed(0)}
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
