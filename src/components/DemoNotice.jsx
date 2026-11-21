import { Info } from "lucide-react"
import { isDemonstrationData, reportingPeriod } from "../data/analytics"

export default function DemoNotice() {
  if (!isDemonstrationData) return null

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
      <Info className="mt-0.5 size-4 shrink-0 text-indigo-600" aria-hidden="true" />
      <p>
        <span className="font-semibold">Demonstration data.</span> This dashboard uses a synthetic snapshot
        as of {reportingPeriod.asOf} so the analytics layout can be reviewed before live workforce modules are
        connected.
      </p>
    </div>
  )
}
