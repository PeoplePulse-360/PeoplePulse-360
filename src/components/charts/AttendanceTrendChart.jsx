import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatPercent } from "../../utils/format"
import ChartTooltip from "./ChartTooltip"
import { axisTick, gridStroke, series } from "./chartTheme"

export default function AttendanceTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
        <CartesianGrid stroke={gridStroke} vertical={false} />
        <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          width={44}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          wrapperStyle={{ zIndex: 30, outline: "none" }}
          content={(props) => <ChartTooltip {...props} formatValue={(value) => formatPercent(value)} />}
        />
        <Line
          type="monotone"
          dataKey="rate"
          name="Attendance"
          stroke={series.blue}
          strokeWidth={2.5}
          dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
