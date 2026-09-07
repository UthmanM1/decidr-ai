"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  FunnelChart,
  Funnel,
  LabelList
} from "recharts";

const axisStyle = { fontSize: 11, fill: "#5B6470" };

export function TrendLineChart({
  data,
  dataKey,
  xKey = "date",
  color = "#2F5D50"
}: {
  data: Record<string, any>[];
  dataKey: string;
  xKey?: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#E4E2DC" vertical={false} />
        <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E4E2DC" }} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({
  data,
  dataKey,
  xKey,
  color = "#2F5D50",
  horizontal = false
}: {
  data: Record<string, any>[];
  dataKey: string;
  xKey: string;
  color?: string;
  horizontal?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 34)}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 16, left: horizontal ? 90 : -20, bottom: 0 }}
      >
        <CartesianGrid stroke="#E4E2DC" horizontal={!horizontal} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} width={90} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
          </>
        )}
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E4E2DC" }} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleFunnelChart({ data }: { data: { stage: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <FunnelChart>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E4E2DC" }} />
        <Funnel dataKey="value" data={data} isAnimationActive={false} fill="#2F5D50">
          <LabelList position="right" dataKey="stage" fill="#14171C" stroke="none" fontSize={12} />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}
