import { Info } from "lucide-react"
import { isDemonstrationData } from "../data/analytics"

export default function DemoNotice() {
  if (!isDemonstrationData) return null

  return (
    <div className="flex items-start gap-3 rounded-[20px] border border-[var(--border,#E7E9F0)] bg-[var(--primary-light,#F0EEFC)] px-4 py-3 text-sm text-[var(--text-main,#303447)]">
      <Info className="mt-0.5 size-4 shrink-0 text-[var(--primary-hover,#8F87DC)]" aria-hidden="true" />
      <p>
        <span className="font-semibold">Live and sample data.</span> When you are signed in,{" "}
        <span className="font-semibold">workforce, recruitment and employee exits</span> show live data from the
        database. Attendance and leave switch to live data as soon as those modules have records. Performance and
        feedback use a demonstration snapshot until their database tables exist. Each section says which data it
        shows.
      </p>
    </div>
  )
}