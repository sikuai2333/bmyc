import type { ReactNode } from 'react'

export function ChartCard({
  title,
  subtitle,
  children,
  className = ''
}: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`card card-hover p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="h-72">{children}</div>
    </div>
  )
}
