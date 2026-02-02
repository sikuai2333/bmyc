import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { EVALUATION_TYPES } from '../constants';

function EvaluationPage({
  people,
  selectedPerson,
  setSelectedPersonId,
  evaluations,
  setEvaluations,
  canEditEvaluations,
  apiBase,
  authHeaders,
  setToast
}) {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    type: EVALUATION_TYPES[0].value,
    period: '',
    content: ''
  });

  const filteredPeople = useMemo(
    () =>
      people.filter((person) =>
        person.name.includes(search) ||
        (person.department && person.department.includes(search)) ||
        (person.title && person.title.includes(search))
      ),
    [people, search]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPerson) {
      setToast('请先选择人员');
      return;
    }
    if (!form.period || !form.content.trim()) {
      setToast('请补全评价周期与内容');
      return;
    }
    try {
      const payload = {
        personId: selectedPerson.id,
        type: form.type,
        period: form.period.trim(),
        content: form.content.trim()
      };
      const { data } = await axios.post(`${apiBase}/evaluations`, payload, authHeaders);
      setEvaluations((prev) => [data, ...prev]);
      setForm((prev) => ({ ...prev, content: '' }));
      setToast('评价已保存');
    } catch (error) {
      setToast(error.response?.data?.message || '保存评价失败');
    }
  };

  return (
    <section className="module-page">
      <aside className="talent-sidebar">
        <div className="talent-filters">
          <div className="panel-subtitle">人员筛选</div>
          <h3>人员检索</h3>
          <label>
            姓名/部门
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="姓名 / 部门" />
          </label>
        </div>
        <div className="talent-list">
          <h4>人员列表</h4>
          <div className="talent-list-scroll">
            {filteredPeople.map((person) => (
              <button
                key={person.id}
                className={`talent-list-item ${selectedPerson && selectedPerson.id === person.id ? 'active' : ''}`}
                onClick={() => setSelectedPersonId(person.id)}
              >
                <p className="name">{person.name}</p>
                <p className="meta">
                  {person.title} · {person.department}
                </p>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="module-detail">
        <div className="panel">
          <div className="panel-head">
            <h3>评价记录</h3>
            <p className="panel-subtitle">{selectedPerson ? selectedPerson.name : '请选择人员'}</p>
          </div>
          <div className="evaluation-list">
            {evaluations.length === 0 && <p className="muted">暂无评价记录。</p>}
            {evaluations.map((item) => {
              const typeLabel = EVALUATION_TYPES.find((type) => type.value === item.type)?.label || item.type;
              return (
                <div key={item.id} className="evaluation-card">
                  <div>
                    <strong>{typeLabel}</strong>
                    <span>{item.period}</span>
                  </div>
                  <p>{item.content}</p>
                  {item.created_at && <small>创建时间：{item.created_at}</small>}
                </div>
              );
            })}
          </div>
        </div>

        {canEditEvaluations && (
          <div className="panel">
            <div className="panel-head">
              <h3>新增评价</h3>
              <p className="panel-subtitle">由领导填写季度/年度评价</p>
            </div>
            <form className="admin-form" onSubmit={handleSubmit}>
              <label>
                评价类型
                <select
                  value={form.type}
                  onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                >
                  {EVALUATION_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                评价周期
                <input
                  placeholder="例如 2026Q1 / 2026年度"
                  value={form.period}
                  onChange={(event) => setForm((prev) => ({ ...prev, period: event.target.value }))}
                />
              </label>
              <label>
                评价内容
                <textarea
                  value={form.content}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                />
              </label>
              <button className="primary-button" type="submit" disabled={!selectedPerson}>
                保存评价
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

export default EvaluationPage;
