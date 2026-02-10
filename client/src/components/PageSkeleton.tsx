import { Skeleton } from 'antd'

export function PageSkeleton() {
  return (
    <div className="px-6 py-8">
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  )
}
