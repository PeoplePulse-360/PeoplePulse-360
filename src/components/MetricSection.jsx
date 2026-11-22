export default function MetricSection({
  title,
  description,
  children,
  gridClassName = "sm:grid-cols-2 lg:grid-cols-3",
}) {
  return (
    <section className="space-y-3">
      <div className="max-w-3xl">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      <div className={`grid gap-3 ${gridClassName}`}>{children}</div>
    </section>
  )
}
