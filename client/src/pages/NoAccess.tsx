import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function NoAccess() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="card p-6 md:p-8 max-w-md w-full text-center">
        <h2 className="text-lg font-semibold text-slate-800">暂无访问权限</h2>
        <p className="mt-2 text-sm text-slate-500">请联系管理员开通权限后再试。</p>
        <Button type="primary" className="mt-6 h-11 md:h-10" onClick={() => navigate('/')}>
          返回首页
        </Button>
      </div>
    </div>
  )
}
