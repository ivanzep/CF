import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtMoney, fmtMonth } from "../lib/format";

interface Props {
  months: string[];
  monthly: Record<string, number>;
}

function useIsDark() {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);
  return isDark;
}

const palette = {
  light: { series: "#2a78d6", grid: "#e1e0d9", axis: "#898781", surface: "#fcfcfb", text: "#0b0b0b" },
  dark: { series: "#3987e5", grid: "#2c2c2a", axis: "#898781", surface: "#1a1a19", text: "#ffffff" },
};

function ChartTooltip({ active, payload, label, colors }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.grid}`,
        borderRadius: 6,
        padding: "6px 10px",
        fontSize: 12,
        color: colors.text,
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ color: colors.axis, marginBottom: 2 }}>{fmtMonth(label)}</div>
      <div style={{ fontVariantNumeric: "tabular-nums" }}>{fmtMoney(payload[0].value)}</div>
    </div>
  );
}

export function CashflowChart({ months, monthly }: Props) {
  const isDark = useIsDark();
  const colors = isDark ? palette.dark : palette.light;
  const data = months.map((m) => ({ month: m, amount: monthly[m] ?? 0 }));
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="cashflow-chart">
      <div className="cashflow-chart__header">
        <h3>Total Monthly Cashflow</h3>
        <button className="link-button" onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? "▸ expand" : "▾ collapse"}
        </button>
      </div>
      {!collapsed && (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="0" />
          <XAxis
            dataKey="month"
            tickFormatter={(m) => fmtMonth(m)}
            tick={{ fill: colors.axis, fontSize: 11 }}
            axisLine={{ stroke: colors.grid }}
            tickLine={false}
            interval={Math.max(0, Math.floor(data.length / 12))}
          />
          <YAxis
            tickFormatter={(v) => fmtMoney(v)}
            tick={{ fill: colors.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip content={<ChartTooltip colors={colors} />} cursor={{ fill: colors.grid, opacity: 0.4 }} />
          <Bar dataKey="amount" fill={colors.series} radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}
