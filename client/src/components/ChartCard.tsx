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
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
        {subtitle ? (
          <p className="mt-1 text-base font-semibold text-slate-800">{subtitle}</p>
        ) : null}
      </div>
      <div className="h-72">{children}</div>
    </div>
  )
}
