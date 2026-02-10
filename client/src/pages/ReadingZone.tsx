import { Button, Modal, Tag } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { SectionHeader } from '../components/SectionHeader'
import { READING_CATEGORIES } from '../constants'
import { fetchReadingItems } from '../services/readingZone'
import type { ReadingItem } from '../types/reading'
import { formatDate } from '../utils/format'

const CATEGORY_COLORS: Record<string, string> = {
  电子书籍: 'blue',
  行业前沿资讯: 'cyan',
  精品课程: 'gold'
}

export default function ReadingZone() {
  const [items, setItems] = useState<ReadingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [activeItem, setActiveItem] = useState<ReadingItem | null>(null)

  const loadItems = async () => {
    try {
      setLoading(true)
      const data = await fetchReadingItems()
      setItems(data || [])
      setError('')
    } catch (err: any) {
      setItems([])
      setError(err?.response?.data?.message || '加载金读专区失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>(READING_CATEGORIES || [])
    items.forEach((item) => {
      if (item.category) {
        set.add(item.category)
      }
    })
    return ['全部', ...Array.from(set)]
  }, [items])

  const filteredItems = useMemo(() => {
    if (selectedCategory === '全部') return items
    return items.filter((item) => item.category === selectedCategory)
  }, [items, selectedCategory])

  const renderSummary = (item: ReadingItem) =>
    item.summary || item.content || '暂无摘要'

  return (
    <div className="space-y-6">
      <SectionHeader
        title="金读专区"
        subtitle="电子书籍、行业前沿资讯、精品课程 · 支持碎片化、便捷化阅读"
        action={
          <Button className="h-11 md:h-10" onClick={loadItems} loading={loading}>
            刷新内容
          </Button>
        }
      />

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">栏目分类</span>
          {categories.map((category) => (
            <Button
              key={category}
              type={selectedCategory === category ? 'primary' : 'default'}
              size="small"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="card p-6">
          <p className="text-sm text-slate-600">加载失败：{error}</p>
          <Button className="mt-4" onClick={loadItems}>
            重新加载
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item) => (
          <div key={item.id} className="card card-hover overflow-hidden flex flex-col">
            <div className="h-40 w-full bg-slate-100">
              {item.cover_url ? (
                <img
                  src={item.cover_url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl font-semibold text-slate-400">
                  {item.category?.slice(0, 1) || '读'}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <Tag color={CATEGORY_COLORS[item.category] || 'blue'}>{item.category || '内容'}</Tag>
                <span>{formatDate(item.published_at || item.created_at || '')}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-slate-800">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{renderSummary(item)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>{item.read_minutes ? `预计 ${item.read_minutes} 分钟` : '碎片化阅读'}</span>
                <span>{item.author_name ? `发布人：${item.author_name}` : '发布人：系统'}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button size="small" onClick={() => setActiveItem(item)}>
                  阅读详情
                </Button>
                {item.source_url ? (
                  <a href={item.source_url} target="_blank" rel="noreferrer">
                    <Button size="small" type="primary">
                      打开链接
                    </Button>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {loading && filteredItems.length === 0 ? (
          <div className="card p-6 md:col-span-2 xl:col-span-3">
            <p className="text-sm text-slate-500">正在加载内容...</p>
          </div>
        ) : null}
        {!loading && filteredItems.length === 0 ? (
          <div className="card p-6 md:col-span-2 xl:col-span-3">
            <p className="text-sm text-slate-500">暂无内容发布。</p>
          </div>
        ) : null}
      </div>

      <Modal
        open={Boolean(activeItem)}
        title={activeItem?.title}
        onCancel={() => setActiveItem(null)}
        footer={[
          <Button key="close" onClick={() => setActiveItem(null)}>
            关闭
          </Button>,
          activeItem?.source_url ? (
            <a key="open" href={activeItem.source_url} target="_blank" rel="noreferrer">
              <Button type="primary">打开链接</Button>
            </a>
          ) : null
        ].filter(Boolean)}
      >
        {activeItem ? (
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Tag color={CATEGORY_COLORS[activeItem.category] || 'blue'}>
                {activeItem.category || '内容'}
              </Tag>
              <span>{formatDate(activeItem.published_at || activeItem.created_at || '')}</span>
              {activeItem.read_minutes ? <span>预计 {activeItem.read_minutes} 分钟</span> : null}
            </div>
            {activeItem.summary ? <p className="text-slate-600">{activeItem.summary}</p> : null}
            {activeItem.content
              ? activeItem.content.split('\n').map((line, idx) => (
                  <p key={`${activeItem.id}-line-${idx}`}>{line}</p>
                ))
              : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
