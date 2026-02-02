import React, { useMemo, useState } from 'react';
import axios from 'axios';

function CertificatesPage({
  people,
  selectedPerson,
  setSelectedPersonId,
  certificates,
  setCertificates,
  canManageCertificates,
  apiBase,
  authHeaders,
  setToast
}) {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    issuedDate: '',
    description: '',
    file: null
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

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedPerson) {
      setToast('请先选择人员');
      return;
    }
    if (!form.name.trim()) {
      setToast('请填写证书名称');
      return;
    }
    try {
      const payload = new FormData();
      payload.append('personId', selectedPerson.id);
      payload.append('name', form.name.trim());
      payload.append('issuedDate', form.issuedDate);
      payload.append('description', form.description.trim());
      if (form.file) {
        payload.append('file', form.file);
      }
      const { data } = await axios.post(`${apiBase}/certificates`, payload, {
        headers: { ...authHeaders.headers, 'Content-Type': 'multipart/form-data' }
      });
      setCertificates((prev) => [data, ...prev]);
      setForm({ name: '', issuedDate: '', description: '', file: null });
      setToast('证书已上传');
    } catch (error) {
      setToast(error.response?.data?.message || '上传失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确认删除该证书？')) return;
    try {
      await axios.delete(`${apiBase}/certificates/${id}`, authHeaders);
      setCertificates((prev) => prev.filter((item) => item.id !== id));
      setToast('证书已删除');
    } catch (error) {
      setToast(error.response?.data?.message || '删除失败');
    }
  };

  const handleDownload = async (item) => {
    try {
      const response = await axios.get(`${apiBase}/certificates/${item.id}/file`, {
        ...authHeaders,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.name || 'certificate'}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setToast(error.response?.data?.message || '下载失败');
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
            <h3>证书档案</h3>
            <p className="panel-subtitle">{selectedPerson ? selectedPerson.name : '请选择人员'}</p>
          </div>
          <div className="certificate-list">
            {certificates.length === 0 && <p className="muted">暂无证书记录。</p>}
            {certificates.map((item) => (
              <div key={item.id} className="certificate-card">
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.issued_date || '未填写时间'}</span>
                  <p>{item.description || '暂无描述'}</p>
                </div>
                <div className="certificate-actions">
                  {item.file_path && (
                    <button className="ghost-button slim" onClick={() => handleDownload(item)}>
                      下载附件
                    </button>
                  )}
                  {canManageCertificates && (
                    <button className="ghost-button slim" onClick={() => handleDelete(item.id)}>
                      删除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {canManageCertificates && (
          <div className="panel">
            <div className="panel-head">
              <h3>上传证书</h3>
              <p className="panel-subtitle">支持 PDF/JPG/PNG</p>
            </div>
            <form className="admin-form" onSubmit={handleUpload}>
              <input
                placeholder="证书名称"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <div className="form-row">
                <input
                  type="date"
                  value={form.issuedDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, issuedDate: event.target.value }))}
                />
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(event) => setForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
                />
              </div>
              <textarea
                placeholder="证书描述"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <button className="primary-button" type="submit" disabled={!selectedPerson}>
                上传证书
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

export default CertificatesPage;
