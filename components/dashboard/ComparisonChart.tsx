"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface Row {
  name: string;
  water: number;
  energy: number;
  food: number;
}

export function ComparisonChart({
  data,
  baselineWater,
}: {
  data: Row[];
  baselineWater?: number;
}) {
  const chartData = data.map((d) => ({
    scenario: d.name,
    Water: d.water,
    Energy: d.energy,
    Food: d.food,
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="scenario" tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
            }}
          />
          <Legend />
          {baselineWater != null && (
            <ReferenceLine
              y={baselineWater}
              stroke="#64748b"
              strokeDasharray="4 4"
              label={{ value: "Baseline water ref", fill: "#94a3b8", fontSize: 10 }}
            />
          )}
          <Bar dataKey="Water" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Energy" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Food" fill="#22C55E" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
