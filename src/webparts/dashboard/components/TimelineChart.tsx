// TimelineChart.tsx
// Bar chart – items added per week, derived from the registry's dateField.
// Uses recharts BarChart (React 17 compatible).

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis as XAxisType,
  YAxis as YAxisType,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { IRegistryItem } from "../hooks/useRegistryData";

// Recharts 2.x class components need this cast to satisfy @types/react 17 JSX checks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const XAxis = XAxisType as unknown as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const YAxis = YAxisType as unknown as React.FC<any>;

interface IBucket {
  week: string;
  count: number;
}

function buildWeeklyBuckets(items: IRegistryItem[]): IBucket[] {
  if (!items.length) return [];

  const buckets: Record<string, number> = {};

  items.forEach((item) => {
    if (!item.date) return;
    const d = new Date(item.date);
    if (isNaN(d.getTime())) return;

    // ISO week start (Monday)
    const day = d.getDay(); // 0=Sun,6=Sat
    const diff = (day === 0 ? -6 : 1) - day; // offset to Monday
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const key = monday.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    buckets[key] = (buckets[key] !== undefined ? buckets[key] : 0) + 1;
  });

  // Sort chronologically
  const entries = Object.keys(buckets).map(
    (k): IBucket => ({ week: k, count: buckets[k] }),
  );
  entries.sort((a: IBucket, b: IBucket) => {
    const da = new Date(a.week).getTime();
    const db = new Date(b.week).getTime();
    return da - db;
  });

  return entries;
}

interface ITimelineChartProps {
  items: IRegistryItem[];
}

const TimelineChart: React.FC<ITimelineChartProps> = ({ items }) => {
  const data = buildWeeklyBuckets(items);

  if (!data.length) {
    return (
      <div style={{ textAlign: "center", padding: 24, color: "#8c8c8c" }}>
        No timeline data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 11, fill: "#595959" }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#595959" }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 6 }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 18 }} />
        <Bar
          dataKey="count"
          name="Items added"
          fill="#0078d4"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TimelineChart;
