import type { Metric } from '../types/dashboard'

export function MetricCard({ metric }: { metric: Metric }) {
  return (
    <div className="card card-hover p-5">
      <p className="text-sm text-slate-500">{metric.label}</p>
      <div className="mt-3 flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-slate-800">{metric.value}</span>
          {metric.unit ? <span className="text-sm text-slate-500">{metric.unit}</span> : null}
        </div>
        {metric.trend ? (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
            {metric.trend}
          </span>
        ) : null}
      </div>
    </div>
  )
}
