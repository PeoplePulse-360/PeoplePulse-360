import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatNumber } from "../../utils/format"
import ChartTooltip from "./ChartTooltip"
import { axisTick, gridStroke, series } from "./chartTheme"

export default function RecruitmentChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
        <CartesianGrid stroke={gridStroke} vertical={false} />
        <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis yAxisId="applications" tick={axisTick} axisLine={false} tickLine={false} width={36} />
        <YAxis yAxisId="outcomes" orientation="right" tick={axisTick} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          wrapperStyle={{ zIndex: 30, outline: "none" }}
          cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
          content={(props) => <ChartTooltip {...props} formatValue={(value) => formatNumber(value)} />}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          yAxisId="applications"
          dataKey="applications"
          name="Applications"
          fill={series.blue}
          radius={[6, 6, 0, 0]}
          barSize={18}
        />
        <Line
          yAxisId="outcomes"
          type="monotone"
          dataKey="selected"
          name="Selected"
          stroke={series.emerald}
          strokeWidth={2.5}
          dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
        />
        <Line
          yAxisId="outcomes"
          type="monotone"
          dataKey="rejected"
          name="Rejected"
          stroke={series.rose}
          strokeWidth={2.5}
          dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
