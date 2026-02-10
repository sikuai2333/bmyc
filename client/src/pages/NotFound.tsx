import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="card p-6 md:p-8 max-w-md w-full text-center">
        <h2 className="text-lg font-semibold text-slate-800">页面不存在</h2>
        <p className="mt-2 text-sm text-slate-500">路径可能已调整，请返回首页。</p>
        <Button type="primary" className="mt-6 h-11 md:h-10" onClick={() => navigate('/')}>
          返回首页
        </Button>
      </div>
    </div>
  )
}
