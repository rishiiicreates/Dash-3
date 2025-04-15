import * as React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { getPlatformColor } from "@/lib/utils";

type ChartDataPoint = {
  [key: string]: string | number;
};

type ChartType = "area" | "bar" | "line" | "pie";

interface ChartProps {
  data: ChartDataPoint[];
  type: ChartType;
  dataKey: string;
  xAxisKey?: string;
  height?: number | string;
  colors?: string[];
  stacked?: boolean;
  platform?: string;
  tooltip?: boolean;
  grid?: boolean;
  labels?: boolean;
  legend?: boolean;
  className?: string;
}

export function Chart({
  data,
  type,
  dataKey,
  xAxisKey = "name",
  height = 300,
  colors,
  stacked = false,
  platform,
  tooltip = true,
  grid = false,
  labels = true,
  legend = false,
  className,
}: ChartProps) {
  // Determine colors based on platform or provided colors
  const chartColors = colors || (platform ? [getPlatformColor(platform)] : ["#3B82F6", "#8B5CF6"]);
  
  // Make sure we have data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg">
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === "area" && (
          <AreaChart data={data}>
            {grid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            {labels && <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />}
            {labels && <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />}
            {tooltip && <Tooltip />}
            <Area
              type="monotone"
              dataKey={dataKey}
              fill={chartColors[0]}
              stroke={chartColors[0]}
              fillOpacity={0.2}
            />
          </AreaChart>
        )}

        {type === "bar" && (
          <BarChart data={data}>
            {grid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            {labels && <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />}
            {labels && <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />}
            {tooltip && <Tooltip />}
            <Bar dataKey={dataKey} fill={chartColors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}

        {type === "line" && (
          <LineChart data={data}>
            {grid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            {labels && <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />}
            {labels && <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />}
            {tooltip && <Tooltip />}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={chartColors[0]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        )}

        {type === "pie" && (
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={xAxisKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill={chartColors[0]}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            {tooltip && <Tooltip />}
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
