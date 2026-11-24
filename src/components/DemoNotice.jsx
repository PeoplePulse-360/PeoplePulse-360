import { Info } from "lucide-react"
import { isDemonstrationData, reportingPeriod } from "../data/analytics"

export default function DemoNotice({ message }) {
  if (!message && !isDemonstrationData) return null

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--primary-light)] px-4 py-3 text-sm text-[var(--text-main)]">
      <Info className="mt-0.5 size-4 shrink-0 text-[var(--primary-hover)]" aria-hidden="true" />
      <p>
        {message ? message : <><span className="font-semibold">Demonstration data.</span> This dashboard uses a synthetic snapshot
        as of {reportingPeriod.asOf} so the analytics layout can be reviewed before live workforce modules are
        connected.</>}
      </p>
    </div>
  )
}
