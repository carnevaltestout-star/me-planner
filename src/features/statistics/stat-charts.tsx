import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCssVar } from "@/lib/statistics/use-css-var";
import type { DistributionSlice, SeriesPoint } from "@/lib/statistics/stat-types";

function useChartTheme() {
  return {
    accent: useCssVar("--color-accent", "#8b6ba8"),
    inkMuted: useCssVar("--color-ink-muted", "#8a7f8c"),
    border: useCssVar("--color-border", "#e4d9e3"),
    surface: useCssVar("--color-surface", "#ffffff"),
    ink: useCssVar("--color-ink", "#362e38"),
  };
}

const tickStyle = (inkMuted: string) => ({ fontSize: 10, fill: inkMuted });

interface SeriesChartProps {
  data: SeriesPoint[];
  color?: string;
}

export function StatBarChart({ data, color }: SeriesChartProps) {
  const { accent, inkMuted, border, surface, ink } = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
        <CartesianGrid stroke={border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={tickStyle(inkMuted)} axisLine={{ stroke: border }} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={tickStyle(inkMuted)} axisLine={{ stroke: border }} tickLine={false} width={30} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: border, opacity: 0.3 }}
          contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: border, background: surface, color: ink }}
        />
        <Bar dataKey="value" fill={color ?? accent} radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatLineChart({ data, color }: SeriesChartProps) {
  const { accent, inkMuted, border, surface, ink } = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid stroke={border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={tickStyle(inkMuted)} axisLine={{ stroke: border }} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={tickStyle(inkMuted)} axisLine={{ stroke: border }} tickLine={false} width={30} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: border, background: surface, color: ink }} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color ?? accent}
          strokeWidth={2.2}
          dot={{ r: 2.5 }}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface DistributionChartProps {
  data: DistributionSlice[];
}

export function StatPieChart({ data }: DistributionChartProps) {
  const { surface, border, ink } = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={38}
          outerRadius={62}
          paddingAngle={2}
          stroke="none"
          isAnimationActive={false}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, _name, entry) => [`${value} (${(entry.payload as DistributionSlice).percent}%)`, (entry.payload as DistributionSlice).label]}
          contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: border, background: surface, color: ink }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function StatHistogram({ data }: DistributionChartProps) {
  const { inkMuted, border, surface, ink } = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }} barCategoryGap={2}>
        <CartesianGrid stroke={border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={tickStyle(inkMuted)} axisLine={{ stroke: border }} tickLine={false} />
        <YAxis tick={tickStyle(inkMuted)} axisLine={{ stroke: border }} tickLine={false} width={30} allowDecimals={false} />
        <Tooltip
          formatter={(value: number, _name, entry) => [`${value} (${(entry.payload as DistributionSlice).percent}%)`, ""]}
          contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: border, background: surface, color: ink }}
        />
        <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.key} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
