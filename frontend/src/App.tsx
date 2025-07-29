import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Chat } from '@/pages/Chat'
import { ExcelUpload } from '@/pages/ExcelUpload'
import { Expenses } from '@/pages/Expenses'
import { Settings } from '@/pages/Settings'
import { AuthProvider } from '@/hooks/useAuth'

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          {/* 메인 레이아웃을 사용하는 라우트들 */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="chat" element={<Chat />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="excel" element={<ExcelUpload />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* 404 페이지 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App