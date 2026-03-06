import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { IRegistryConfig } from "../config/registryConfig";
import { IRegistryItem } from "../hooks/useRegistryData";

// Colour assignment
const COMPLETED_PALETTE = ["#52c41a", "#741275", "#95de64", "#b7eb8f"];
const ACTIVE_PALETTE = ["#faad14", "#ffc53d", "#ffd666"];
const REJECTED_PALETTE = ["#cf1322", "#f5222d", "#ff4d4f", "#ff7875"];
const OPEN_PALETTE = ["#1677ff", "#4096ff", "#69b1ff", "#91caff"];

function buildColourMap(registry: IRegistryConfig): Record<string, string> {
  const map: Record<string, string> = {};
  let ci = 0,
    ai = 0,
    ri = 0,
    oi = 0;

  registry.statuses.forEach((s: string) => {
    if (/reject/i.test(s)) {
      map[s] = REJECTED_PALETTE[ri++ % REJECTED_PALETTE.length];
    } else if (registry.completedStatuses.indexOf(s) !== -1) {
      map[s] = COMPLETED_PALETTE[ci++ % COMPLETED_PALETTE.length];
    } else if (/review|investigating|delayed|progress|under/i.test(s)) {
      map[s] = ACTIVE_PALETTE[ai++ % ACTIVE_PALETTE.length];
    } else {
      map[s] = OPEN_PALETTE[oi++ % OPEN_PALETTE.length];
    }
  });

  return map;
}

// Custom label 
interface ILabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  count: number;
}

const RADIAN = Math.PI / 180;

function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  count,
}: ILabelProps): React.ReactElement | undefined {
  if (percent < 0.04) return undefined;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {count}
    </text>
  );
}

// Pie data entry
interface IPieEntry {
  name: string;
  value: number;
}

// Component
interface IStatusPieChartProps {
  registry: IRegistryConfig;
  items: IRegistryItem[];
}

const StatusPieChart: React.FC<IStatusPieChartProps> = ({
  registry,
  items,
}) => {
  const colourMap = React.useMemo(() => buildColourMap(registry), [registry]);

  const data = React.useMemo((): IPieEntry[] => {
    const counts: Record<string, number> = {};
    registry.statuses.forEach((s: string) => {
      counts[s] = 0;
    });
    items.forEach((item) => {
      if (counts[item.status] !== undefined) {
        counts[item.status]++;
      } else {
        counts[item.status] = 1;
      }
    });
    return Object.keys(counts)
      .filter((k: string) => counts[k] > 0)
      .map((name: string): IPieEntry => ({ name, value: counts[name] }));
  }, [items, registry]);

  const total = data.reduce((s: number, d: IPieEntry) => s + d.value, 0);

  if (!total) {
    return (
      <div style={{ textAlign: "center", padding: 24, color: "#8c8c8c" }}>
        No status data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label={(props: any) =>
            renderCustomLabel({ ...props, count: props.value })
          }
          labelLine={false}
        >
          {data.map((entry: IPieEntry) => (
            <Cell key={entry.name} fill={colourMap[entry.name] || "#8c8c8c"} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [
            `${value} (${((value / total) * 100).toFixed(1)}%)`,
            name,
          ]}
          contentStyle={{ fontSize: 12, borderRadius: 6 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value: string) => {
            const found = data.find((d: IPieEntry) => d.name === value);
            const count = found ? found.value : 0;
            return `${value} — ${((count / total) * 100).toFixed(1)}%`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default StatusPieChart;
