import { Input } from 'antd'
import { useMemo, useState } from 'react'
import type { Person } from '../types/archive'

export function PersonSelector({
  people,
  selectedPersonId,
  onSelect,
  placeholder = '姓名 / 部门'
}: {
  people: Person[]
  selectedPersonId: number | null
  onSelect: (id: number) => void
  placeholder?: string
}) {
  const [search, setSearch] = useState('')
  const filteredPeople = useMemo(() => {
    const keyword = search.trim()
    if (!keyword) return people
    return people.filter(
      (person) =>
        person.name.includes(keyword) ||
        (person.department || '').includes(keyword) ||
        (person.title || '').includes(keyword)
    )
  }, [people, search])

  return (
    <div className="card p-4 space-y-3">
      <div>
        <p className="text-xs text-slate-500">人员筛选</p>
        <h3 className="text-sm font-semibold text-slate-800">人员检索</h3>
      </div>
      <Input
        placeholder={placeholder}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="space-y-2 max-h-96 overflow-auto striped-list">
        {filteredPeople.map((person) => (
          <button
            key={person.id}
            type="button"
            className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
              selectedPersonId === person.id
                ? 'border-blue-500 bg-blue-50/40'
                : 'border-slate-100 hover:border-slate-200'
            }`}
            onClick={() => onSelect(person.id)}
          >
            <p className="font-medium text-slate-800">{person.name}</p>
            <p className="text-xs text-slate-500">
              {(person.title || '—') + ' · ' + (person.department || '—')}
            </p>
          </button>
        ))}
        {filteredPeople.length === 0 && (
          <p className="text-xs text-slate-400">暂无匹配人员</p>
        )}
      </div>
    </div>
  )
}
