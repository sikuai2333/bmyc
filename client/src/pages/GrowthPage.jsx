import React, { useMemo, useState } from 'react';
import axios from 'axios';

function GrowthPage({
  people,
  selectedPerson,
  setSelectedPersonId,
  growthEvents,
  setGrowthEvents,
  canEditGrowth,
  apiBase,
  authHeaders,
  setToast
}) {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    eventDate: '',
    title: '',
    description: '',
    category: ''
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
    if (!form.eventDate || !form.title.trim()) {
      setToast('请填写事件时间与标题');
      return;
    }
    try {
      const payload = {
        personId: selectedPerson.id,
        eventDate: form.eventDate,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim()
      };
      const { data } = await axios.post(`${apiBase}/growth`, payload, authHeaders);
      setGrowthEvents((prev) => [data, ...prev]);
      setForm((prev) => ({ ...prev, title: '', description: '' }));
      setToast('成长事件已添加');
    } catch (error) {
      setToast(error.response?.data?.message || '添加失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确认删除该成长事件？')) return;
    try {
      await axios.delete(`${apiBase}/growth/${id}`, authHeaders);
      setGrowthEvents((prev) => prev.filter((item) => item.id !== id));
      setToast('成长事件已删除');
    } catch (error) {
      setToast(error.response?.data?.message || '删除失败');
    }
  };

  return (
    <section className="module-page growth-page">
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
            <h3>成长轨迹</h3>
            <p className="panel-subtitle">{selectedPerson ? selectedPerson.name : '请选择人员'}</p>
          </div>
          <div className="growth-timeline">
            {growthEvents.length === 0 && <p className="muted">暂无成长轨迹记录。</p>}
            {growthEvents.map((item) => (
              <div key={item.id} className="timeline-card">
                <div className="timeline-date">{item.event_date}</div>
                <div className="timeline-main">
                  <div className="timeline-head">
                    <div className="timeline-title">
                      <strong>{item.title}</strong>
                      {item.category && <span className="tag-pill">{item.category}</span>}
                    </div>
                    {canEditGrowth && (
                      <button className="danger-button slim" onClick={() => handleDelete(item.id)}>
                        删除
                      </button>
                    )}
                  </div>
                  <p>{item.description || '暂无描述'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {canEditGrowth && (
          <div className="panel">
            <div className="panel-head">
              <h3>新增成长事件</h3>
              <p className="panel-subtitle">记录培训、项目、获奖等关键节点</p>
            </div>
            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, eventDate: event.target.value }))}
                />
                <input
                  placeholder="事件类型（可选）"
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                />
              </div>
              <input
                placeholder="事件标题"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
              <textarea
                placeholder="事件描述"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <button className="primary-button" type="submit" disabled={!selectedPerson}>
                保存成长事件
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

export default GrowthPage;
