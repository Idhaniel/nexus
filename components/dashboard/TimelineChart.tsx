"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import type { FEWOutputYear } from "@/lib/model/fewEngine";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TimelineChartProps {
  timeline: FEWOutputYear[];
  showUncertainty?: boolean;
}

export function TimelineChart({
  timeline,
  showUncertainty = true,
}: TimelineChartProps) {
  const [mode, setMode] = useState<"index" | "absolute">("index");

  const data = timeline.map((y) => ({
    year: y.year,
    waterUse: y.waterUse,
    energyUse: y.energyUse,
    foodOutput: y.foodOutput,
    waterAbs: y.waterUseAbsolute,
    energyAbs: y.energyUseAbsolute,
    foodAbs: y.foodOutputAbsolute,
    waterLow: Math.max(0, y.waterUse * 0.92),
    waterHigh: Math.min(100, y.waterUse * 1.08),
  }));

  return (
    <div className="space-y-3">
      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <TabsList>
          <TabsTrigger value="index">Index (0–100)</TabsTrigger>
          <TabsTrigger value="absolute">Absolute units</TabsTrigger>
        </TabsList>
        <TabsContent value="index" className="mt-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                {showUncertainty && (
                  <Area
                    type="monotone"
                    dataKey="waterHigh"
                    stackId="w"
                    stroke="none"
                    fill="#0EA5E9"
                    fillOpacity={0.08}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="waterUse"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  dot={false}
                  name="Water"
                />
                <Line
                  type="monotone"
                  dataKey="energyUse"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                  name="Energy"
                />
                <Line
                  type="monotone"
                  dataKey="foodOutput"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={false}
                  name="Food"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
        <TabsContent value="absolute" className="mt-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="waterAbs"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  name="Water (Bm³)"
                />
                <Line
                  type="monotone"
                  dataKey="energyAbs"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Energy (TWh)"
                />
                <Line
                  type="monotone"
                  dataKey="foodAbs"
                  stroke="#22C55E"
                  strokeWidth={2}
                  name="Food (Mt)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
