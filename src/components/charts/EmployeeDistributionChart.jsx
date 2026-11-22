import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { formatNumber } from "../../utils/format"
import ChartTooltip from "./ChartTooltip"
import { distributionColors } from "./chartTheme"

export default function EmployeeDistributionChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <PieChart accessibilityLayer>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="46%"
          innerRadius={58}
          outerRadius={86}
          paddingAngle={2}
          stroke="#fff"
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={distributionColors[index % distributionColors.length]} />
          ))}
        </Pie>
        <Tooltip
          wrapperStyle={{ zIndex: 30, outline: "none" }}
          content={(props) => <ChartTooltip {...props} formatValue={(value) => formatNumber(value)} />}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(name, entry) => `${name} (${formatNumber(entry?.payload?.value ?? 0)})`}
          wrapperStyle={{ fontSize: 12, color: "#475569" }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
