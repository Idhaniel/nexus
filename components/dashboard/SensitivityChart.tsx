"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { SensitivityResult } from "@/lib/model/fewEngine";

const DIM_COLORS: Record<string, string> = {
  water: "#0EA5E9",
  energy: "#F59E0B",
  food: "#22C55E",
};

export function SensitivityChart({
  data,
  dimension = "overall",
}: {
  data: SensitivityResult[];
  dimension?: "water" | "energy" | "food" | "overall";
}) {
  const sorted = [...data].sort(
    (a, b) => b.overallSensitivity - a.overallSensitivity
  );

  const rows = sorted.map((s) => {
    let value = s.overallSensitivity;
    let dim = "overall" as keyof typeof DIM_COLORS;
    if (dimension === "water") {
      value = s.impactOnWater;
      dim = "water";
    } else if (dimension === "energy") {
      value = s.impactOnEnergy;
      dim = "energy";
    } else if (dimension === "food") {
      value = s.impactOnFood;
      dim = "food";
    }
    return {
      name: s.parameterName,
      value,
      color:
        dimension === "overall"
          ? "#94a3b8"
          : DIM_COLORS[dim] ?? "#94a3b8",
    };
  });

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 120, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" domain={[0, "auto"]} tick={{ fill: "#94a3b8" }} />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {rows.map((entry, index) => (
              <Cell key={`c-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
