import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatNumber } from "../../utils/format"
import ChartTooltip from "./ChartTooltip"
import { axisTick, gridStroke, series } from "./chartTheme"

export default function GoalCompletionChart({ data }) {
  const rows = [...data].reverse()

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }} accessibilityLayer>
        <CartesianGrid stroke={gridStroke} horizontal={false} />
        <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
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
          cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
          content={(props) => <ChartTooltip {...props} formatValue={(value) => formatNumber(value)} />}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="goalsCompleted" name="Completed" stackId="goals" fill={series.emerald} barSize={14} />
        <Bar dataKey="goalsInProgress" name="In progress" stackId="goals" fill={series.amber} barSize={14} />
        <Bar
          dataKey="goalsNotStarted"
          name="Not started"
          stackId="goals"
          fill={series.slate}
          radius={[0, 6, 6, 0]}
          barSize={14}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
