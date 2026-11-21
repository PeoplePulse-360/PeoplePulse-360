import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatRating } from "../../utils/format"
import ChartTooltip from "./ChartTooltip"
import { axisTick, gridStroke, series } from "./chartTheme"

export default function FeedbackTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
        <CartesianGrid stroke={gridStroke} vertical={false} />
        <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis
          domain={[3.8, 4.6]}
          ticks={[3.8, 4, 4.2, 4.4, 4.6]}
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          width={36}
          tickFormatter={(value) => Number(value).toFixed(1)}
        />
        <Tooltip
          wrapperStyle={{ zIndex: 30, outline: "none" }}
          content={(props) => <ChartTooltip {...props} formatValue={(value) => formatRating(value)} />}
        />
        <Line
          type="monotone"
          dataKey="score"
          name="Average score"
          stroke={series.indigo}
          strokeWidth={2.5}
          dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
