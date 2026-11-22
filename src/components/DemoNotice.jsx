import { Info } from "lucide-react"
import { isDemonstrationData, reportingPeriod } from "../data/analytics"

export default function DemoNotice() {
  if (!isDemonstrationData) return null

  return (
    <div className="flex items-start gap-3 rounded-[20px] border border-[var(--border,#E7E9F0)] bg-[var(--primary-light,#F0EEFC)] px-4 py-3 text-sm text-[var(--text-main,#303447)]">
      <Info className="mt-0.5 size-4 shrink-0 text-[var(--primary-hover,#8F87DC)]" aria-hidden="true" />
      <p>
        <span className="font-semibold">Demonstration data.</span> Workforce, recruitment, attendance, leave,
        performance, and feedback use a synthetic snapshot as of {reportingPeriod.asOf} until those modules
        are connected. <span className="font-semibold">Employee exits</span> show live data from the exit
        records database when you are signed in.
      </p>
    </div>
  )
}