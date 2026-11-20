import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatRating } from "../../utils/format"
import ChartTooltip from "./ChartTooltip"
import { axisTick, gridStroke, series } from "./chartTheme"

export default function PerformanceChart({ data, average }) {
  const rows = [...data].reverse()

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }} accessibilityLayer>
        <CartesianGrid stroke={gridStroke} horizontal={false} />
        <XAxis
          type="number"
          domain={[3, 5]}
          ticks={[3, 3.5, 4, 4.5, 5]}
          tick={axisTick}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="shortName"
          width={96}
          interval={0}
          tick={axisTick}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          wrapperStyle={{ zIndex: 30, outline: "none" }}
          cursor={{ fill: "rgba(79, 70, 229, 0.06)" }}
          content={(props) => <ChartTooltip {...props} formatValue={(value) => formatRating(value)} />}
        />
        <ReferenceLine x={average} stroke="#94a3b8" strokeDasharray="4 4" />
        <Bar dataKey="rating" name="Average rating" fill={series.indigo} radius={[0, 6, 6, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  )
}
