import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatNumber } from "../../utils/format"
import ChartTooltip from "./ChartTooltip"
import { axisTick, gridStroke, series } from "./chartTheme"

export default function ExitReasonChart({ data }) {
  const rows = [...data].reverse()

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 28, left: 4, bottom: 4 }} accessibilityLayer>
        <CartesianGrid stroke={gridStroke} horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={124}
          interval={0}
          tick={{ ...axisTick, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          wrapperStyle={{ zIndex: 30, outline: "none" }}
          cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
          content={(props) => <ChartTooltip {...props} formatValue={(value) => formatNumber(value)} />}
        />
        <Bar dataKey="count" name="Exits" fill={series.blue} radius={[0, 6, 6, 0]} barSize={16}>
          <LabelList dataKey="count" position="right" fill="#475569" fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
