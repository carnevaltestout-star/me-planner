import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCssVar } from "@/lib/statistics/use-css-var";
import type { DoneUndoneBar } from "@/lib/statistics/goals-stats";
import { DONE_COLOR, UNDONE_COLOR } from "@/lib/statistics/goals-stats";
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

// One bar per kind (Goals, To-Dos), each internally stacked into a
// done/not-done split — hovering a segment shows its own count and
// percentage of that kind's total, not of the combined whole.
export function StatDoneUndoneBarChart({ data }: { data: DoneUndoneBar[] }) {
  const { inkMuted, border, surface, ink } = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid stroke={border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={tickStyle(inkMuted)} axisLine={{ stroke: border }} tickLine={false} />
        <YAxis tick={tickStyle(inkMuted)} axisLine={{ stroke: border }} tickLine={false} width={30} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: border, opacity: 0.3 }}
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;
            const done = Number(payload.find((p) => p.dataKey === "done")?.value ?? 0);
            const undone = Number(payload.find((p) => p.dataKey === "undone")?.value ?? 0);
            const total = done + undone;
            return (
              <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: "6px 10px", fontSize: 12 }}>
                <p style={{ margin: 0, fontWeight: 600, color: ink }}>{label}</p>
                <p style={{ margin: 0, color: DONE_COLOR }}>
                  Done: {done} ({total ? Math.round((done / total) * 100) : 0}%)
                </p>
                <p style={{ margin: 0, color: UNDONE_COLOR }}>
                  Not done: {undone} ({total ? Math.round((undone / total) * 100) : 0}%)
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="done" stackId="a" fill={DONE_COLOR} isAnimationActive={false} maxBarSize={48} />
        <Bar dataKey="undone" stackId="a" fill={UNDONE_COLOR} radius={[3, 3, 0, 0]} isAnimationActive={false} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
