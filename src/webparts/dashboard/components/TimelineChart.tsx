import * as React from "react";
import { Button, DatePicker } from "antd";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const XAxis = XAxisType as unknown as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const YAxis = YAxisType as unknown as React.FC<any>;

const { RangePicker } = DatePicker;

// Types
type TPreset = 7 | 30 | 90 | "custom";

interface IBucket {
  day: string; 
  sortKey: string; 
  count: number;
}

// Helpers
function toMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function localIso(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function buildDailyBuckets(
  items: IRegistryItem[],
  from: Date,
  to: Date,
): IBucket[] {
  const fromMs = toMidnight(from).getTime();
  const toMs = toMidnight(to).getTime();
  const map: Record<string, number> = {};

  items.forEach((item) => {
    if (!item.date) return;
    const d = new Date(item.date);
    if (isNaN(d.getTime())) return;
    const dayMs = toMidnight(d).getTime();
    if (dayMs < fromMs || dayMs > toMs) return;
    const k = localIso(d);
    map[k] = (map[k] || 0) + 1;
  });

  return Object.keys(map)
    .sort()
    .map(
      (k): IBucket => ({
        sortKey: k,
        day: new Date(k + "T00:00:00").toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        count: map[k],
      }),
    );
}

// Preset button 
interface IPresetBtnProps {
  label: string;
  active: boolean;
  onClick: () => void;
}
const PresetBtn: React.FC<IPresetBtnProps> = ({ label, active, onClick }) => (
  <Button
    prefixCls="iso-ant-btn"
    size="small"
    type={active ? "primary" : "default"}
    onClick={onClick}
    style={{ fontSize: 11, padding: "0 8px" }}
  >
    {label}
  </Button>
);

// ── Component ─────────────────────────────────────────────────────────────────
interface ITimelineChartProps {
  items: IRegistryItem[];
}

const TimelineChart: React.FC<ITimelineChartProps> = ({ items }) => {
  const today = toMidnight(new Date());

  // Default: last 7 days
  const [preset, setPreset] = React.useState<TPreset>(7);
  const [customFrom, setCustomFrom] = React.useState<Date>(
    new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
  );
  const [customTo, setCustomTo] = React.useState<Date>(today);

  const { from, to } = React.useMemo((): { from: Date; to: Date } => {
    if (preset === "custom") return { from: customFrom, to: customTo };
    return {
      from: new Date(today.getTime() - (preset - 1) * 24 * 60 * 60 * 1000),
      to: today,
    };
  }, [preset, customFrom, customTo]);

  const data = React.useMemo(
    () => buildDailyBuckets(items, from, to),
    [items, from, to],
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRangeChange = (dates: any): void => {
    if (!dates || !dates[0] || !dates[1]) return;
    setCustomFrom(
      toMidnight(dates[0].toDate ? dates[0].toDate() : new Date(dates[0])),
    );
    setCustomTo(
      toMidnight(dates[1].toDate ? dates[1].toDate() : new Date(dates[1])),
    );
    setPreset("custom");
  };

  return (
    <div>
      {/*Filter toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <PresetBtn
          label="Last 7 days"
          active={preset === 7}
          onClick={() => setPreset(7)}
        />
        <PresetBtn
          label="Last 30 days"
          active={preset === 30}
          onClick={() => setPreset(30)}
        />
        <PresetBtn
          label="Last 90 days"
          active={preset === 90}
          onClick={() => setPreset(90)}
        />
        <RangePicker
          prefixCls="iso-ant-picker"
          size="small"
          style={{ fontSize: 11 }}
          onChange={handleRangeChange}
          // Clear picker selection when a preset is chosen
          value={preset === "custom" ? undefined : null}
          placeholder={["From", "To"]}
        />
        {data.length === 0 && (
          <span style={{ fontSize: 11, color: "#8c8c8c", marginLeft: 4 }}>
            No items in this range
          </span>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 24, left: 0, bottom: 56 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "#595959" }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#595959" }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 6 }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 14 }} />
          <Bar
            dataKey="count"
            name="Items added"
            fill="#0078d4"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimelineChart;
