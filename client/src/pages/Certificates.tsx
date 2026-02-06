import { Button, Form, Input, Select, Upload, message } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { PersonSelector } from '../components/PersonSelector'
import { SectionHeader } from '../components/SectionHeader'
import { useAppData } from '../hooks/useAppData'
import { api } from '../utils/api'
import { ALLOWED_CERT_TYPES, isFileValid, MAX_UPLOAD_SIZE_MB } from '../utils/file'

export default function Certificates() {
  const {
    people,
    selectedPerson,
    selectedPersonId,
    setSelectedPersonId,
    certificates,
    refreshAll,
    canManageCertificates
  } = useAppData()
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    setSelectedCategory('全部')
  }, [selectedPerson?.id])

  const categories = useMemo(() => {
    const set = new Set<string>()
    certificates.forEach((item) => {
      if (item.category) set.add(item.category)
    })
    return Array.from(set)
  }, [certificates])

  const filteredCertificates = useMemo(() => {
    if (selectedCategory === '全部') return certificates
    if (selectedCategory === '未分类') return certificates.filter((item) => !item.category)
    return certificates.filter((item) => item.category === selectedCategory)
  }, [certificates, selectedCategory])

  const handleUpload = async (values: {
    name: string
    category?: string
    issuedDate?: string
    description?: string
  }) => {
    if (!selectedPerson) {
      message.warning('请先选择人员')
      return
    }
    if (!values.name?.trim()) {
      message.warning('请填写证书名称')
      return
    }
    try {
      setUploading(true)
      const payload = new FormData()
      payload.append('personId', String(selectedPerson.id))
      payload.append('name', values.name.trim())
      payload.append('category', values.category?.trim() || '')
      payload.append('issuedDate', values.issuedDate || '')
      payload.append('description', values.description?.trim() || '')
      const file = fileList[0]?.originFileObj
      if (file) {
        payload.append('file', file as File)
      }
      await api.post('/certificates', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      message.success('证书已上传')
      form.resetFields()
      setFileList([])
      refreshAll()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('确认删除该证书？')) return
    try {
      await api.delete(`/certificates/${id}`)
      message.success('证书已删除')
      refreshAll()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '删除失败')
    }
  }

  const handleDownload = async (id: number, name?: string) => {
    try {
      const response = await api.get(`/certificates/${id}/file`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = name || 'certificate'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      message.error(err?.response?.data?.message || '下载失败')
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="证书管理"
        subtitle="支持上传 pdf/jpg/png，并记录元数据"
        action={
          <Button type="primary" className="h-11 md:h-10">
            上传证书
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PersonSelector
            people={people}
            selectedPersonId={selectedPersonId}
            onSelect={setSelectedPersonId}
          />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <h3 className="text-base font-semibold text-slate-800">证书档案</h3>
            <p className="text-xs text-slate-500">
              {selectedPerson ? selectedPerson.name : '请选择人员'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">证书分类</span>
              <Button
                size="small"
                type={selectedCategory === '全部' ? 'primary' : 'default'}
                onClick={() => setSelectedCategory('全部')}
              >
                全部
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  size="small"
                  type={selectedCategory === category ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
              {certificates.some((item) => !item.category) && (
                <Button
                  size="small"
                  type={selectedCategory === '未分类' ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory('未分类')}
                >
                  未分类
                </Button>
              )}
            </div>
            {filteredCertificates.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="暂无证书" description="上传证书后可在此查看与下载" />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {filteredCertificates.map((item) => (
                  <div key={item.id} className="rounded-md border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                          {item.category ? <span className="text-xs text-slate-500">{item.category}</span> : null}
                        </div>
                        <p className="text-xs text-slate-500">{item.issued_date || '未填写时间'}</p>
                        <p className="mt-2 text-sm text-slate-600">{item.description || '暂无描述'}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {item.file_path ? (
                          <Button size="small" onClick={() => handleDownload(item.id, item.name)}>
                            下载
                          </Button>
                        ) : null}
                        {canManageCertificates ? (
                          <Button danger size="small" onClick={() => handleDelete(item.id)}>
                            删除
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {canManageCertificates ? (
            <div className="card p-5">
              <h3 className="text-base font-semibold text-slate-800">上传证书</h3>
              <p className="text-xs text-slate-500">支持 PDF / JPG / PNG</p>
              <Form form={form} layout="vertical" className="mt-4" onFinish={handleUpload}>
                <Form.Item
                  label="证书名称"
                  name="name"
                  rules={[{ required: true, message: '请填写证书名称' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item label="证书分类" name="category">
                  <Input placeholder="可选" />
                </Form.Item>
                <Form.Item label="颁发时间" name="issuedDate">
                  <Input type="date" />
                </Form.Item>
                <Form.Item label="证书描述" name="description">
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item label="附件">
                  <Upload
                    beforeUpload={(file) => {
                      const { isTypeAllowed, isSizeAllowed } = isFileValid(file)
                      if (!isTypeAllowed) {
                        message.error('仅支持 PDF/JPG/PNG 文件')
                        return Upload.LIST_IGNORE
                      }
                      if (!isSizeAllowed) {
                        message.error(`文件大小不能超过 ${MAX_UPLOAD_SIZE_MB}MB`)
                        return Upload.LIST_IGNORE
                      }
                      return false
                    }}
                    accept={ALLOWED_CERT_TYPES.join(',')}
                    fileList={fileList}
                    onChange={(info) => setFileList(info.fileList.slice(-1))}
                    maxCount={1}
                  >
                    <Button>选择文件</Button>
                  </Upload>
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="h-11 md:h-10"
                  loading={uploading}
                  disabled={!selectedPerson}
                >
                  上传证书
                </Button>
              </Form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
