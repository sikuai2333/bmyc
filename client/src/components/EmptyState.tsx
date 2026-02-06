import { Empty } from 'antd'

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="card p-6">
      <Empty description={description ?? title} />
    </div>
  )
}
