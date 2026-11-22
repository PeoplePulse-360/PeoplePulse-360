const tones = {
  indigo: "bg-[var(--primary-light)] text-[var(--primary-hover)]",
  blue: "bg-[var(--secondary-light)] text-[var(--info)]",
  emerald: "bg-[var(--bg-muted)] text-[var(--success)]",
  amber: "bg-[var(--bg-muted)] text-[var(--text-secondary)]",
  rose: "bg-[var(--secondary-light)] text-[var(--info)]",
  slate: "bg-[var(--bg-muted)] text-[var(--text-secondary)]",
}

export default function KpiCard({ label, value, hint, icon: Icon, tone = "indigo" }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-500">{label}</h3>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tones[tone] ?? tones.indigo}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p> : null}
    </article>
  )
}
