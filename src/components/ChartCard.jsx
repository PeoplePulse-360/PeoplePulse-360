export default function ChartCard({
  title,
  description,
  children,
  heightClass = "h-72",
  className = "",
}) {
  return (
    <section className={`min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <header className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description ? <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p> : null}
      </header>
      <div className={heightClass}>{children}</div>
    </section>
  )
}
