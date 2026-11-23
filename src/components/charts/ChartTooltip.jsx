function displayValue(value, formatValue, item) {
  const raw = Array.isArray(value) ? value.at(-1) : value
  if (formatValue) return formatValue(raw, item)
  return raw
}

export default function ChartTooltip({ active, payload, label, formatValue, details }) {
  if (!active || !payload?.length) return null

  const row = payload[0]?.payload
  const title = row?.name ?? label
  const extra = details && row ? details(row) : []

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      {title ? <p className="mb-1.5 font-semibold text-slate-900">{title}</p> : null}
      <ul className="space-y-1">
        {payload.map((item) => (
          <li key={`${item.dataKey}-${item.name}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span
                className="size-2 rounded-full"
                style={{ background: item.color || item.fill || item.stroke || "#A29BEA" }}
              />
              {item.name}
            </span>
            <span className="font-semibold text-slate-900">{displayValue(item.value, formatValue, item)}</span>
          </li>
        ))}
        {extra.map(([extraLabel, extraValue]) => (
          <li key={extraLabel} className="flex items-center justify-between gap-4 text-slate-500">
            <span>{extraLabel}</span>
            <span className="font-semibold text-slate-900">{extraValue}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
