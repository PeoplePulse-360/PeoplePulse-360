// Icon tones use the official PeoplePulse palette (with hex fallbacks).
const tones = {
  indigo: "bg-[var(--primary-light,#F0EEFC)] text-[var(--primary-hover,#8F87DC)]",
  blue: "bg-[var(--secondary-light,#E9EAF8)] text-[var(--info,#8C9FD5)]",
  emerald: "bg-[color-mix(in_srgb,var(--success,#68B99A)_18%,white)] text-[var(--success,#68B99A)]",
  amber: "bg-[color-mix(in_srgb,var(--warning,#E8B66F)_20%,white)] text-[var(--warning,#E8B66F)]",
  rose: "bg-[color-mix(in_srgb,var(--danger,#E58B9E)_16%,white)] text-[var(--danger,#E58B9E)]",
  slate: "bg-[var(--bg-muted,#F3F4F7)] text-[var(--text-secondary,#777D91)]",
}

export default function KpiCard({ label, value, hint, icon: Icon, tone = "indigo" }) {
  return (
    <article className="flex items-center gap-4 rounded-[20px] border border-[var(--border,#E7E9F0)] bg-white p-5 shadow-[0_2px_8px_rgba(40,45,65,0.045)] transition-shadow hover:shadow-[0_4px_14px_rgba(40,45,65,0.08)]">
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-full ${tones[tone] ?? tones.indigo}`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-[var(--text-secondary,#777D91)]">{label}</h3>
        <p className="mt-0.5 text-2xl font-semibold tracking-tight text-[var(--text-main,#303447)]">{value}</p>
        {hint ? (
          <p className="mt-0.5 text-xs leading-5 text-[var(--text-muted,#A0A4B2)]">{hint}</p>
        ) : null}
      </div>
    </article>
  )
}